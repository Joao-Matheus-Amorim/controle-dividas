import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import type {
  DbBankAccount,
  DbFamilyMember,
  DbFinancialMovement,
  DbExpense,
  DbPayableBill,
  DbReceivableIncome,
} from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type RawFinancialMovement = Omit<
  DbFinancialMovement,
  "banks" | "family_members" | "payable_bills" | "receivable_incomes" | "expenses"
> & {
  banks?: never;
  family_members?: never;
  payable_bills?: never;
  receivable_incomes?: never;
  expenses?: never;
};

type MovementBankRelation = Pick<DbBankAccount, "id" | "bank_name" | "account_type" | "currency">;
type MovementMemberRelation = Pick<DbFamilyMember, "id" | "name">;
type MovementPayableRelation = Pick<DbPayableBill, "id" | "name" | "bill_type" | "status">;
type MovementReceivableRelation = Pick<DbReceivableIncome, "id" | "source" | "income_type" | "status">;
type MovementExpenseRelation = Pick<DbExpense, "id" | "description" | "payment_method">;

const financialMovementSelect = [
  "id",
  "owner_id",
  "organization_id",
  "family_member_id",
  "bank_id",
  "movement_type",
  "direction",
  "amount",
  "currency",
  "occurred_at",
  "recorded_timezone",
  "payable_bill_id",
  "receivable_income_id",
  "expense_id",
  "created_by_profile_id",
  "notes",
  "created_at",
  "updated_at",
].join(", ");

function normalizeFinancialMovement({
  movement,
  banksById,
  membersById,
  payablesById,
  receivablesById,
  expensesById,
}: {
  movement: RawFinancialMovement;
  banksById: Map<string, MovementBankRelation>;
  membersById: Map<string, MovementMemberRelation>;
  payablesById: Map<string, MovementPayableRelation>;
  receivablesById: Map<string, MovementReceivableRelation>;
  expensesById: Map<string, MovementExpenseRelation>;
}): DbFinancialMovement {
  return {
    ...movement,
    banks: banksById.get(movement.bank_id) ?? null,
    family_members: membersById.get(movement.family_member_id) ?? null,
    payable_bills: movement.payable_bill_id
      ? payablesById.get(movement.payable_bill_id) ?? null
      : null,
    receivable_incomes: movement.receivable_income_id
      ? receivablesById.get(movement.receivable_income_id) ?? null
      : null,
    expenses: movement.expense_id ? expensesById.get(movement.expense_id) ?? null : null,
  };
}

export async function getOrganizationFinancialMovements(orgSlug?: string) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const [payableMemberIds, receivableMemberIds, expenseMemberIds] = await Promise.all([
    getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view", orgSlug),
    getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view", orgSlug),
    getAccessibleMemberIds("GASTOS", "can_view", orgSlug),
  ]);
  const accessibleMemberIds = Array.from(
    new Set([...payableMemberIds, ...receivableMemberIds, ...expenseMemberIds]),
  );

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const [
    { data: payableMovementsData, error: payableMovementsError },
    { data: receivableMovementsData, error: receivableMovementsError },
    { data: expenseMovementsData, error: expenseMovementsError },
  ] = await Promise.all([
    payableMemberIds.length > 0
      ? supabase
          .from("financial_movements")
          .select(financialMovementSelect)
          .eq("organization_id", organization.id)
          .eq("movement_type", "payable_bill_payment")
          .in("family_member_id", payableMemberIds)
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    receivableMemberIds.length > 0
      ? supabase
          .from("financial_movements")
          .select(financialMovementSelect)
          .eq("organization_id", organization.id)
          .eq("movement_type", "receivable_income_receipt")
          .in("family_member_id", receivableMemberIds)
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    expenseMemberIds.length > 0
      ? supabase
          .from("financial_movements")
          .select(financialMovementSelect)
          .eq("organization_id", organization.id)
          .eq("movement_type", "expense_payment")
          .in("family_member_id", expenseMemberIds)
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const movementsError = payableMovementsError ?? receivableMovementsError ?? expenseMovementsError;

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  const movements = [
    ...((payableMovementsData ?? []) as unknown as RawFinancialMovement[]),
    ...((receivableMovementsData ?? []) as unknown as RawFinancialMovement[]),
    ...((expenseMovementsData ?? []) as unknown as RawFinancialMovement[]),
  ].sort((first, second) => {
    const occurredAtComparison = second.occurred_at.localeCompare(first.occurred_at);

    if (occurredAtComparison !== 0) {
      return occurredAtComparison;
    }

    return second.created_at.localeCompare(first.created_at);
  });

  if (movements.length === 0) {
    return [];
  }

  const bankIds = Array.from(new Set(movements.map((movement) => movement.bank_id)));
  const payableIds = Array.from(
    new Set(
      movements
        .map((movement) => movement.payable_bill_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const receivableIds = Array.from(
    new Set(
      movements
        .map((movement) => movement.receivable_income_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const expenseIds = Array.from(
    new Set(
      movements
        .map((movement) => movement.expense_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [
    { data: banksData, error: banksError },
    { data: membersData, error: membersError },
    { data: payablesData, error: payablesError },
    { data: receivablesData, error: receivablesError },
    { data: expensesData, error: expensesError },
  ] = await Promise.all([
    supabase
      .from("banks")
      .select("id, bank_name, account_type, currency")
      .eq("organization_id", organization.id)
      .in("id", bankIds),
    supabase
      .from("family_members")
      .select("id, name")
      .eq("organization_id", organization.id)
      .in("id", accessibleMemberIds),
    payableIds.length > 0
      ? supabase
          .from("payable_bills")
          .select("id, name, bill_type, status")
          .eq("organization_id", organization.id)
          .in("id", payableIds)
      : Promise.resolve({ data: [], error: null }),
    receivableIds.length > 0
      ? supabase
          .from("receivable_incomes")
          .select("id, source, income_type, status")
          .eq("organization_id", organization.id)
          .in("id", receivableIds)
      : Promise.resolve({ data: [], error: null }),
    expenseIds.length > 0
      ? supabase
          .from("expenses")
          .select("id, description, payment_method")
          .eq("organization_id", organization.id)
          .in("id", expenseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError = banksError ?? membersError ?? payablesError ?? receivablesError ?? expensesError;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const banksById = new Map(
    ((banksData ?? []) as MovementBankRelation[]).map((bank) => [bank.id, bank]),
  );
  const membersById = new Map(
    ((membersData ?? []) as MovementMemberRelation[]).map((member) => [member.id, member]),
  );
  const payablesById = new Map(
    ((payablesData ?? []) as MovementPayableRelation[]).map((payable) => [payable.id, payable]),
  );
  const receivablesById = new Map(
    ((receivablesData ?? []) as MovementReceivableRelation[]).map((receivable) => [
      receivable.id,
      receivable,
    ]),
  );
  const expensesById = new Map(
    ((expensesData ?? []) as MovementExpenseRelation[]).map((expense) => [expense.id, expense]),
  );

  return movements.map((movement) =>
    normalizeFinancialMovement({
      movement,
      banksById,
      membersById,
      payablesById,
      receivablesById,
      expensesById,
    }),
  );
}
