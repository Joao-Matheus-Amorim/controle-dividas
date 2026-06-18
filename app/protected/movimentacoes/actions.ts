"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import { getCurrentProfile } from "@/lib/finance/access-control";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

const movementReversalRateLimit = {
  operationKey: "finance.movement.reverse",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

export type MovementReversalActionState = {
  error?: string;
  success?: string;
};

async function recordMovementReversalAuditEvent({
  organizationId,
  movementId,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  movementId: string | null;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action: "finance.movement.reverse",
    targetType: "financial_movement",
    targetId: movementId,
    outcome,
    metadata,
  });
}

export async function reverseFinancialMovement(
  _prevState: MovementReversalActionState,
  formData: FormData,
): Promise<MovementReversalActionState> {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!id) {
    return { error: "Movimentacao nao encontrada." };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { data: movement, error: movementLookupError } = await supabase
    .from("financial_movements")
    .select("id, movement_type, direction, family_member_id, payable_bill_id, receivable_income_id, reversed_at")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (movementLookupError) {
    return { error: movementLookupError.message };
  }

  if (!movement) {
    return { error: "Movimentacao nao encontrada." };
  }

  if (movement.reversed_at) {
    return { error: "Movimentacao ja estornada." };
  }

  if (!["payable_bill_payment", "receivable_income_receipt"].includes(String(movement.movement_type))) {
    return { error: "Estorno disponivel apenas para pagamentos e recebimentos." };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...movementReversalRateLimit,
    actorKey: profile.id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordMovementReversalAuditEvent({
      organizationId: organization.id,
      movementId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        movement_type: String(movement.movement_type),
        family_member_id: String(movement.family_member_id ?? ""),
      },
    });

    return { error: "Muitas tentativas de estorno. Tente novamente em alguns minutos." };
  }

  const { error } = await supabase.rpc("reverse_financial_movement", {
    target_organization_id: organization.id,
    target_financial_movement_id: id,
    target_profile_id: profile.id,
    target_reversal_reason: reason || null,
  });

  if (error) {
    return { error: error.message };
  }

  await recordMovementReversalAuditEvent({
    organizationId: organization.id,
    movementId: id,
    metadata: {
      movement_reversed: true,
      movement_type: String(movement.movement_type),
      direction: String(movement.direction),
      family_member_id: String(movement.family_member_id ?? ""),
      payable_bill_id: movement.payable_bill_id ? String(movement.payable_bill_id) : null,
      receivable_income_id: movement.receivable_income_id ? String(movement.receivable_income_id) : null,
    },
  });

  revalidateOrganizationPaths([
    "/protected/movimentacoes",
    "/protected/bancos",
    "/protected/contas-a-pagar",
    "/protected/contas-a-receber",
    "/protected/relatorios",
    "/protected",
  ], organization.slug);

  return { success: "Movimentacao estornada com sucesso." };
}
