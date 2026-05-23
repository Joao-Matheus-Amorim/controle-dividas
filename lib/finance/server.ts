import { redirect } from "next/navigation";

import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import { getExpenseCategoriesByOwner } from "@/lib/finance/categories-server";
import { buildExpenseDashboardData } from "@/lib/finance/expense-dashboard-server";
import { getExpensesForCurrentProfile } from "@/lib/finance/expenses-server";
import { getFamilyMembersByOwner } from "@/lib/finance/members-server";
import { buildPayableBillsDashboardData } from "@/lib/finance/payable-dashboard-server";
import { getPayableBillsForCurrentProfile } from "@/lib/finance/payables-server";
import { getReceivableIncomesForCurrentProfile } from "@/lib/finance/receivables-server";
import { seedInitialFinanceDataForOwner } from "@/lib/finance/seed-server";
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

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
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

  return buildExpenseDashboardData({
    allMembers,
    categories,
    expenses,
    accessibleMemberIds,
  });
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

  return buildPayableBillsDashboardData({
    allMembers,
    bills,
    accessibleMemberIds,
  });
}

export async function getReceivableIncomes() {
  await seedInitialFinanceData();

  return getReceivableIncomesForCurrentProfile();
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
