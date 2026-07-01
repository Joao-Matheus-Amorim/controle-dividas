import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationProfile } from "@/lib/finance/access-control";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { auditLog } from "@/lib/ai/audit";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import type { ActionContext, ActionResult } from "@/lib/ai/manager/actions-handler";
import { createExpenseFromAi, createPayableBillFromAi, createReceivableIncomeFromAi, createBankAccountFromAi } from "@/lib/ai/manager/actions-handler";
import { deleteExpenseFromAi, deletePayableBillFromAi, deleteReceivableIncomeFromAi, deleteBankAccountFromAi } from "@/lib/ai/manager/actions-handler";
import { markPayablePaidFromAi, markReceivableReceivedFromAi } from "@/lib/ai/manager/actions-handler";

const actionSchema = z.object({
  actionType: z.enum([
    "create_expense",
    "create_payable_bill",
    "create_receivable_income",
    "create_bank_account",
    "delete_expense",
    "delete_payable_bill",
    "delete_receivable_income",
    "delete_bank_account",
    "mark_payable_paid",
    "mark_receivable_received",
  ]),
  payload: z.record(z.string(), z.unknown()),
  confirmation: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError || !auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { actionType, payload, confirmation } = parsed.data;

    const profile = await getCurrentOrganizationProfile();
    if (!profile?.is_active) {
      return NextResponse.json({ error: "Inactive or missing profile" }, { status: 403 });
    }

    const { organization } = await requireOrganizationAccess();

    const rateLimitKey = profile.id;
    const rateLimitResult = await checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      await auditLog({
        action: `ai.actions.${actionType}`,
        payload,
        result: { error: "rate_limited" },
        success: false,
        organization_id: organization.id,
        created_by: profile.id,
      });

      return NextResponse.json({ error: "Rate limit exceeded", retryAfterMs: rateLimitResult.resetInMs }, { status: 429 });
    }

    if (confirmation !== "confirmado") {
      await auditLog({
        action: `ai.actions.${actionType}`,
        payload,
        result: { error: "confirmation_required" },
        success: false,
        organization_id: organization.id,
        created_by: profile.id,
      });

      return NextResponse.json({ error: "Confirmacao obrigatoria para executar esta acao.", needsConfirmation: true }, { status: 400 });
    }

    const ctx: ActionContext = {
      profileId: profile.id,
      organizationId: organization.id,
      ownerAuthUserId: organization.owner_auth_user_id,
      orgSlug: organization.slug,
      confirmation: confirmation ?? "",
      supabase,
    };

    const result = await executeAction(actionType, payload, ctx);

    if (result.needsConfirmation) {
      await auditLog({
        action: `ai.actions.${actionType}`,
        payload,
        result: { error: "review_required", summary: result.summary, details: result.details },
        success: false,
        organization_id: organization.id,
        created_by: profile.id,
      });

      return NextResponse.json({ error: result.summary ?? "Revise os dados antes de confirmar.", needsConfirmation: true, details: result.details }, { status: 400 });
    }

    if (result.error) {
      await auditLog({
        action: `ai.actions.${actionType}`,
        payload,
        result: { error: result.error },
        success: false,
        organization_id: organization.id,
        created_by: profile.id,
      });

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await auditLog({
      action: `ai.${actionType}`,
      payload,
      result: { success: true },
      success: true,
      organization_id: organization.id,
      created_by: profile.id,
    });

    return NextResponse.json({ result: { success: true, message: result.success } });
  } catch (err) {
    console.error("[API AI Actions] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function executeAction(
  actionType: string,
  payload: Record<string, unknown>,
  ctx: ActionContext,
): Promise<ActionResult> {
  switch (actionType) {
    case "create_expense":
      return createExpenseFromAi(payload, ctx);
    case "create_payable_bill":
      return createPayableBillFromAi(payload, ctx);
    case "create_receivable_income":
      return createReceivableIncomeFromAi(payload, ctx);
    case "create_bank_account":
      return createBankAccountFromAi(payload, ctx);
    case "delete_expense":
      return deleteExpenseFromAi(payload.id as string, ctx);
    case "delete_payable_bill":
      return deletePayableBillFromAi(payload.id as string, ctx);
    case "delete_receivable_income":
      return deleteReceivableIncomeFromAi(payload.id as string, ctx);
    case "delete_bank_account":
      return deleteBankAccountFromAi(payload.id as string, ctx);
    case "mark_payable_paid":
      return markPayablePaidFromAi(payload.billId as string, payload.bankId as string, ctx);
    case "mark_receivable_received":
      return markReceivableReceivedFromAi(payload.incomeId as string, payload.bankId as string | undefined, ctx);
    default:
      return { error: `Unknown action type: ${actionType}` };
  }
}
