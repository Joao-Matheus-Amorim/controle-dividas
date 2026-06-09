import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import { getExpenseCategoriesByOwner } from "@/lib/finance/categories-server";
import { buildExpenseDashboardData } from "@/lib/finance/expense-dashboard-server";
import { getExpensesForCurrentProfile } from "@/lib/finance/expenses-server";
import { getFamilyMembersByOwner } from "@/lib/finance/members-server";
import { buildPayableBillsDashboardData } from "@/lib/finance/payable-dashboard-server";
import { getPayableBillsForCurrentProfile } from "@/lib/finance/payables-server";
import { buildReceivableIncomesDashboardData } from "@/lib/finance/receivable-dashboard-server";
import { getReceivableIncomesForCurrentProfile } from "@/lib/finance/receivables-server";
import { seedInitialFinanceDataForOwner } from "@/lib/finance/seed-server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
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

export async function seedInitialFinanceData() {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess();

  await seedInitialFinanceDataForOwner(
    supabase,
    organization.owner_auth_user_id,
    organization.id,
  );
}

export async function getFamilyMembers() {
  await seedInitialFinanceData();

  const { organization } = await requireOrganizationAccess();
  return getFamilyMembersByOwner(organization.owner_auth_user_id, organization.id);
}

export async function getActiveFamilyMembers() {
  const members = await getFamilyMembers();
  return members.filter((member) => member.is_active);
}

export async function getExpenseCategories() {
  await seedInitialFinanceData();

  const { organization } = await requireOrganizationAccess();
  return getExpenseCategoriesByOwner(organization.owner_auth_user_id, organization.id);
}

export async function getExpenses() {
  await seedInitialFinanceData();

  return getExpensesForCurrentProfile();
}

export async function getExpenseDashboardData() {
  await seedInitialFinanceData();

  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("GASTOS", "can_view");
  const [allMembers, categories, expenses] = await Promise.all([
    getFamilyMembersByOwner(organization.owner_auth_user_id, organization.id),
    getExpenseCategoriesByOwner(organization.owner_auth_user_id, organization.id),
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

  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view");
  const [allMembers, bills] = await Promise.all([
    getFamilyMembersByOwner(organization.owner_auth_user_id, organization.id),
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

  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view");
  const [allMembers, incomes] = await Promise.all([
    getFamilyMembersByOwner(organization.owner_auth_user_id, organization.id),
    getReceivableIncomes(),
  ]);

  return buildReceivableIncomesDashboardData({
    allMembers,
    incomes,
    accessibleMemberIds,
  });
}
