import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationProfile } from "@/lib/finance/access-control";
import { auditLog } from "@/lib/ai/audit";

const payBillSchema = z.object({
  billId: z.string().uuid(),
  bankId: z.string().uuid(),
  organization_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError || !auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = payBillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { billId, bankId, organization_id } = parsed.data;

    const profile = await getCurrentOrganizationProfile();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Inactive or missing profile" }, { status: 403 });
    }

    if (profile.organization_id !== organization_id) {
      return NextResponse.json({ error: "Invalid organization context" }, { status: 403 });
    }

    const { data: bill, error: billError } = await supabase
      .from("payable_bills")
      .select("id, responsible_member_id, name, status, amount, currency")
      .eq("id", billId)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (billError) {
      return NextResponse.json({ error: billError.message }, { status: 500 });
    }

    if (!bill) {
      return NextResponse.json({ error: "Conta nao encontrada." }, { status: 404 });
    }

    if (bill.status === "pago") {
      return NextResponse.json({ error: "Esta conta ja esta marcada como paga." }, { status: 409 });
    }

    if (!bill.responsible_member_id) {
      return NextResponse.json({ error: "Conta sem responsavel vinculado." }, { status: 400 });
    }

    const { data: bank, error: bankError } = await supabase
      .from("banks")
      .select("id, family_member_id")
      .eq("id", bankId)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (bankError) {
      return NextResponse.json({ error: bankError.message }, { status: 500 });
    }

    if (!bank) {
      return NextResponse.json({ error: "Banco nao encontrado." }, { status: 404 });
    }

    if (String(bank.family_member_id ?? "") !== String(bill.responsible_member_id)) {
      return NextResponse.json(
        { error: "O banco selecionado nao pertence ao responsavel desta conta." },
        { status: 403 },
      );
    }

    const recordedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { error: rpcError } = await supabase.rpc("mark_payable_bill_paid_with_movement", {
      target_organization_id: organization_id,
      target_payable_bill_id: billId,
      target_bank_id: bankId,
      target_profile_id: profile.id,
      target_recorded_timezone: recordedTimezone,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    await auditLog({
      action: "finance.payable.status.update",
      payload: { billId, bankId },
      result: { next_status: "pago", billName: bill.name, billAmount: bill.amount },
      success: true,
      organization_id,
      created_by: profile.id,
    });

    return NextResponse.json({
      result: { success: true, billName: bill.name },
    });
  } catch (err) {
    console.error("[API AI PayBill] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
