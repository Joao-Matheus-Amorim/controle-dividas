import { redirect } from "next/navigation";

import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import { getExpenseCategoriesByOwner } from "@/lib/finance/categories-server";
import { getExpensesForCurrentProfile } from "@/lib/finance/expenses-server";
import { getFamilyMembersByOwner } from "@/lib/finance/members-server";
import { getPayableBillsForCurrentProfile } from "@/lib/finance/payables-server";
import { firstRelation, type MaybeArray } from "@/lib/finance/relations";
import { seedInitialFinanceDataForOwner } from "@/lib/finance/seed-server";
import type {
  DbFamilyMember,
  DbReceivableIncome,
} from "@/lib/finance/types";
import { createClient } from "@/lib/supabase/server";

export type {
  DbExpense,
  DbExpenseCategory,
  DbFamilyMember,
  DbPayableBill,
  DbReceivableIncome,
  ExpenseFormState,
  FamilyMemberFormState,
  PayableBillFormState,
  PayableBillType,
  ReceivableIncomeFormState,
} from "@/lib/finance/types";

type RawReceivableIncome = Omit<DbReceivableIncome, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
};

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

function normalizeReceivableIncome(income: RawReceivableIncome): DbReceivableIncome {
  return {
    ...income,
    family_members: firstRelation(income.family_members),
  };
}

export async function seedInitialFinanceData() {
  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await seedInitialFinanceDataForOwner(supabase, ownerId);
}

export async function getFamilyMembers() {
  await seedInitialFinanceData();

  const ownerId = await getCurrentUserId();
  return getFamilyMembersByOwner(ownerId);
}

export async function getActiveFamilyMembers() {
  const members = await getFamilyMembers();
  return members.filter((member) => member.is_active);
}

export async function getExpenseCategories() {
  await seedInitialFinanceData();

  const ownerId = await getCurrentUserId();
  return getExpenseCategoriesByOwner(ownerId);
}

export async function getExpenses() {
  await seedInitialFinanceData();

  return getExpensesForCurrentProfile();
}

export async function getExpenseDashboardData() {
  await seedInitialFinanceData();

  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("GASTOS", "can_view");
  const [allMembers, categories, expenses] = await Promise.all([
    getFamilyMembersByOwner(profile.owner_id),
    getExpenseCategoriesByOwner(profile.owner_id),
    getExpenses(),
  ]);

  const members = allMembers
    .filter((member) => member.is_active)
    .filter((member) => accessibleMemberIds.includes(member.id));

  const memberSummaries = members.map((member) => {
    const spent = expenses
      .filter((expense) => expense.family_member_id === member.id)
      .reduce((total, expense) => total + Number(expense.amount), 0);

    const monthlyLimit = Number(member.monthly_limit);
    const remaining = monthlyLimit - spent;
    const usedPercent = monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0;

    return {
      ...member,
      spent,
      remaining,
      usedPercent,
      exceeded: remaining < 0,
    };
  });

  return {
    members,
    categories,
    expenses,
    memberSummaries,
    totalExpenses: expenses.reduce((total, expense) => total + Number(expense.amount), 0),
  };
}

export async function getPayableBills() {
  await seedInitialFinanceData();

  return getPayableBillsForCurrentProfile();
}

export async function getPayableBillsDashboardData() {
  await seedInitialFinanceData();

  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view");
  const [allMembers, bills] = await Promise.all([
    getFamilyMembersByOwner(profile.owner_id),
    getPayableBills(),
  ]);
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

export async function getReceivableIncomes() {
  await seedInitialFinanceData();

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view");

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("receivable_incomes")
    .select(
      "id, owner_id, receiver_member_id, source, income_type, amount, expected_date, status, receiving_bank, notes, created_at, family_members(id, name)",
    )
    .eq("owner_id", profile.owner_id)
    .in("receiver_member_id", accessibleMemberIds)
    .order("expected_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawReceivableIncome[]).map(normalizeReceivableIncome);
}

export async function getReceivableIncomesDashboardData() {
  await seedInitialFinanceData();

  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view");
  const [allMembers, incomes] = await Promise.all([
    getFamilyMembersByOwner(profile.owner_id),
    getReceivableIncomes(),
  ]);
  const members = allMembers
    .filter((member) => member.is_active)
    .filter((member) => accessibleMemberIds.includes(member.id));

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
