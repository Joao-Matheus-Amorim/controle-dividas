import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type MaybeArray<T> = T | T[] | null;

type RawReceivableIncome = Omit<DbReceivableIncome, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
};

function firstRelation<T>(relation: MaybeArray<T>): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function normalizeReceivableIncome(income: RawReceivableIncome): DbReceivableIncome {
  return {
    ...income,
    family_members: firstRelation(income.family_members),
  };
}

export async function getOrganizationReceivableIncomes(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view", orgSlug);

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("receivable_incomes")
    .select(
      "id, owner_id, receiver_member_id, source, income_type, amount, expected_date, status, receiving_bank, notes, created_at, family_members(id, name)",
    )
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("receiver_member_id", accessibleMemberIds)
    .order("expected_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawReceivableIncome[]).map(normalizeReceivableIncome);
}

export async function getOrganizationReceivableIncomesDashboardData(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view", orgSlug);

  const { data: membersData, error: membersError } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", profile.owner_id)
    .eq("is_active", true)
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const allMembers = (membersData ?? []) as DbFamilyMember[];
  const incomes = await getOrganizationReceivableIncomes(orgSlug);
  const members = allMembers.filter((member) => accessibleMemberIds.includes(member.id));

  const today = new Date().toISOString().slice(0, 10);
  const enrichedIncomes = incomes.map((income) => ({
    ...income,
    computed_status:
      income.status !== "recebido" && income.expected_date < today
        ? "atrasado"
        : income.status,
  }));

  const expectedIncomes = enrichedIncomes.filter((income) => income.computed_status === "previsto");
  const overdueIncomes = enrichedIncomes.filter((income) => income.computed_status === "atrasado");
  const receivedIncomes = enrichedIncomes.filter((income) => income.computed_status === "recebido");
  const fixedIncomes = enrichedIncomes.filter((income) => income.income_type === "fixa");
  const variableIncomes = enrichedIncomes.filter((income) => income.income_type === "variavel");

  return {
    members,
    incomes: enrichedIncomes,
    totalExpected: expectedIncomes.reduce((total, income) => total + Number(income.amount), 0),
    totalOverdue: overdueIncomes.reduce((total, income) => total + Number(income.amount), 0),
    totalReceived: receivedIncomes.reduce((total, income) => total + Number(income.amount), 0),
    totalFixed: fixedIncomes.reduce((total, income) => total + Number(income.amount), 0),
    totalVariable: variableIncomes.reduce((total, income) => total + Number(income.amount), 0),
    expectedCount: expectedIncomes.length,
    overdueCount: overdueIncomes.length,
    receivedCount: receivedIncomes.length,
  };
}
