"use server";

import { getCurrentProfile } from "@/lib/finance/access-control";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

export type MovementReversalActionState = {
  error?: string;
  success?: string;
};

// finance.movement.reverse controls are enforced inside reverse_financial_movement.
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

  const { data, error } = await supabase.rpc("reverse_financial_movement", {
    target_organization_id: organization.id,
    target_financial_movement_id: id,
    target_profile_id: profile.id,
    target_reversal_reason: reason || null,
  });

  if (error) {
    return { error: error.message };
  }

  const result = data as { success?: boolean; error?: unknown } | null;

  if (!result?.success) {
    const rpcError = result?.error
      ? String(result.error)
      : "Nao foi possivel estornar a movimentacao.";

    return { error: rpcError };
  }

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
