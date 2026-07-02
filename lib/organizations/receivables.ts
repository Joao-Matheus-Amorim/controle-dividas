import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import type { DbFamilyMember, DbReceivableIncome, ReversedMovementSummary } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type RawReceivableIncome = Omit<DbReceivableIncome, "family_members"> & {
  family_members?: never;
};

type ReceivableMemberRelation = Pick<DbFamilyMember, "id" | "name">;

function normalizeReceivableIncome(
  income: RawReceivableIncome,
  membersById: Map<string, ReceivableMemberRelation>,
  reversedMovementByIncomeId: Map<string, ReversedMovementSummary> = new Map(),
): DbReceivableIncome {
  return {
    ...income,
    family_members: income.receiver_member_id
      ? membersById.get(income.receiver_member_id) ?? null
      : null,
    last_reversed_movement: reversedMovementByIncomeId.get(income.id) ?? null,
  };
}

async function getLatestReversedReceivableMovements(
  incomeIds: string[],
  organizationId: string,
): Promise<Map<string, ReversedMovementSummary>> {
  if (incomeIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data: movements, error: movementsError } = await supabase
    .from("financial_movements")
    .select("id, receivable_income_id, bank_id, reversed_at")
    .eq("organization_id", organizationId)
    .eq("movement_type", "receivable_income_receipt")
    .not("reversed_at", "is", null)
    .in("receivable_income_id", incomeIds)
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

  const latestByIncomeId = new Map<string, ReversedMovementSummary>();

  (movements ?? []).forEach((movement) => {
    const incomeId = String(movement.receivable_income_id ?? "");

    if (!incomeId || latestByIncomeId.has(incomeId) || !movement.reversed_at) {
      return;
    }

    latestByIncomeId.set(incomeId, {
      id: String(movement.id),
      reversed_at: String(movement.reversed_at),
      bank_name: banksById.get(String(movement.bank_id ?? "")) ?? null,
    });
  });

  return latestByIncomeId;
}

export async function getOrganizationReceivableIncomes(orgSlug?: string) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view", orgSlug);

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
    .from("receivable_incomes")
    .select(
      "id, owner_id, receiver_member_id, source, category, payment_origin, income_type, amount, currency, expected_date, status, receiving_bank, notes, created_at",
    )
    .eq("organization_id", organization.id)
    .in("receiver_member_id", accessibleMemberIds)
    .order("expected_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const membersById = new Map(
    ((membersData ?? []) as ReceivableMemberRelation[]).map((member) => [
      member.id,
      member,
    ]),
  );

  const incomes = (data ?? []) as RawReceivableIncome[];
  const reversedMovementByIncomeId = await getLatestReversedReceivableMovements(
    incomes.map((income) => income.id),
    organization.id,
  );

  return incomes.map((income) =>
    normalizeReceivableIncome(income, membersById, reversedMovementByIncomeId),
  );
}

export async function getOrganizationReceivableIncomesDashboardData(orgSlug?: string) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view", orgSlug);

  const { data: membersData, error: membersError } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
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
