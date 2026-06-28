import "server-only";

import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import type { DbFamilyMember, DbPayableBill, ReversedMovementSummary } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type RawPayableBill = Omit<DbPayableBill, "family_members"> & {
  family_members?: never;
};

type PayableMemberRelation = Pick<DbFamilyMember, "id" | "name">;

function normalizePayableBill(
  bill: RawPayableBill,
  membersById: Map<string, PayableMemberRelation>,
  reversedMovementByBillId: Map<string, ReversedMovementSummary> = new Map(),
): DbPayableBill {
  return {
    ...bill,
    bill_type: bill.bill_type ?? "avulsa",
    family_members: bill.responsible_member_id
      ? membersById.get(bill.responsible_member_id) ?? null
      : null,
    last_reversed_movement: reversedMovementByBillId.get(bill.id) ?? null,
  };
}

async function getLatestReversedPayableMovements(
  billIds: string[],
  organizationId: string,
): Promise<Map<string, ReversedMovementSummary>> {
  if (billIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data: movements, error: movementsError } = await supabase
    .from("financial_movements")
    .select("id, payable_bill_id, bank_id, reversed_at")
    .eq("organization_id", organizationId)
    .eq("movement_type", "payable_bill_payment")
    .not("reversed_at", "is", null)
    .in("payable_bill_id", billIds)
    .order("reversed_at", { ascending: false });

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  const bankIds = Array.from(new Set(
    (movements ?? [])
      .map((movement) => String(movement.bank_id ?? ""))
      .filter(Boolean),
  ));
  const banksById = new Map<string, string>();

  if (bankIds.length > 0) {
    const { data: banks, error: banksError } = await supabase
      .from("banks")
      .select("id, bank_name")
      .eq("organization_id", organizationId)
      .in("id", bankIds);

    if (banksError) {
      throw new Error(banksError.message);
    }

    (banks ?? []).forEach((bank) => {
      banksById.set(String(bank.id), String(bank.bank_name ?? ""));
    });
  }

  const latestByBillId = new Map<string, ReversedMovementSummary>();

  (movements ?? []).forEach((movement) => {
    const billId = String(movement.payable_bill_id ?? "");

    if (!billId || latestByBillId.has(billId) || !movement.reversed_at) {
      return;
    }

    latestByBillId.set(billId, {
      id: String(movement.id),
      reversed_at: String(movement.reversed_at),
      bank_name: banksById.get(String(movement.bank_id ?? "")) ?? null,
    });
  });

  return latestByBillId;
}

export async function getOrganizationPayableBills(orgSlug?: string) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view", orgSlug);

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data: membersData, error: membersError } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("organization_id", organization.id)
    .in("id", accessibleMemberIds);

  if (membersError) {
    throw new Error(membersError.message);
  }

  const { data, error } = await supabase
    .from("payable_bills")
    .select(
      "id, owner_id, name, category, amount, currency, due_date, responsible_member_id, status, bill_type, bank_used, recurrence, notes, created_at",
    )
    .eq("organization_id", organization.id)
    .in("responsible_member_id", accessibleMemberIds)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const membersById = new Map(
    ((membersData ?? []) as PayableMemberRelation[]).map((member) => [
      member.id,
      member,
    ]),
  );

  const bills = (data ?? []) as RawPayableBill[];
  const reversedMovementByBillId = await getLatestReversedPayableMovements(
    bills.map((bill) => bill.id),
    organization.id,
  );

  return bills.map((bill) =>
    normalizePayableBill(bill, membersById, reversedMovementByBillId),
  );
}

export async function getOrganizationPayableBillsDashboardData(orgSlug?: string) {
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view", orgSlug);
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);

  const { data: membersData, error: membersError } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const allMembers = (membersData ?? []) as DbFamilyMember[];
  const bills = await getOrganizationPayableBills(orgSlug);
  const members = allMembers
    .filter((member) => member.is_active)
    .filter((member) => accessibleMemberIds.includes(member.id));

  const today = new Date().toISOString().slice(0, 10);
  const enrichedBills = bills.map((bill) => ({
    ...bill,
    computed_status:
      bill.status !== "pago" && bill.due_date < today ? "atrasado" : bill.status,
  }));

  const pendingBills = enrichedBills.filter((bill) => bill.computed_status === "pendente");
  const overdueBills = enrichedBills.filter((bill) => bill.computed_status === "atrasado");
  const paidBills = enrichedBills.filter((bill) => bill.computed_status === "pago");
  const oneOffBills = enrichedBills.filter((bill) => bill.bill_type === "avulsa");
  const fixedBills = enrichedBills.filter((bill) => bill.bill_type === "fixa");

  return {
    members,
    bills: enrichedBills,
    totalPending: pendingBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalOverdue: overdueBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalPaid: paidBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalOneOff: oneOffBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalFixed: fixedBills.reduce((total, bill) => total + Number(bill.amount), 0),
    pendingCount: pendingBills.length,
    overdueCount: overdueBills.length,
    paidCount: paidBills.length,
    oneOffCount: oneOffBills.length,
    fixedCount: fixedBills.length,
  };
}
