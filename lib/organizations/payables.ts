import "server-only";

import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import type { DbFamilyMember, DbPayableBill } from "@/lib/finance/server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type RawPayableBill = Omit<DbPayableBill, "family_members"> & {
  family_members?: never;
};

type PayableMemberRelation = Pick<DbFamilyMember, "id" | "name">;

function normalizePayableBill(
  bill: RawPayableBill,
  membersById: Map<string, PayableMemberRelation>,
): DbPayableBill {
  return {
    ...bill,
    bill_type: bill.bill_type ?? "avulsa",
    family_members: bill.responsible_member_id
      ? membersById.get(bill.responsible_member_id) ?? null
      : null,
  };
}

export async function getOrganizationPayableBills(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view", orgSlug);

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data: membersData, error: membersError } = await supabase
    .from("family_members")
    .select("id, name")
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("id", accessibleMemberIds);

  if (membersError) {
    throw new Error(membersError.message);
  }

  const { data, error } = await supabase
    .from("payable_bills")
    .select(
      "id, owner_id, name, category, amount, due_date, responsible_member_id, status, bill_type, bank_used, recurrence, notes, created_at",
    )
    .eq("owner_id", profile.owner_id)
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

  return ((data ?? []) as RawPayableBill[]).map((bill) =>
    normalizePayableBill(bill, membersById),
  );
}

export async function getOrganizationPayableBillsDashboardData(orgSlug?: string) {
  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view", orgSlug);
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);

  const { data: membersData, error: membersError } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", profile.owner_id)
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
