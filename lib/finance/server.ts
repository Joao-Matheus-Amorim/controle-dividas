import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { expenseCategories, familyMembers } from "./mock-data";

export type DbFamilyMember = {
  id: string;
  owner_id: string;
  name: string;
  role: string | null;
  monthly_limit: number;
  currency: string;
  is_active: boolean;
  created_at: string;
};

export type DbExpenseCategory = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
};

export type DbExpense = {
  id: string;
  owner_id: string;
  family_member_id: string;
  category_id: string | null;
  expense_date: string;
  description: string;
  purchase_location: string | null;
  amount: number;
  payment_method: string | null;
  bank_or_card: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name" | "monthly_limit"> | null;
  expense_categories: Pick<DbExpenseCategory, "id" | "name"> | null;
};

export type DbPayableBill = {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  amount: number;
  due_date: string;
  responsible_member_id: string | null;
  status: "pago" | "pendente" | "atrasado";
  bank_used: string | null;
  recurrence: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
};

export type FamilyMemberFormState = {
  error?: string;
  success?: string;
};

export type ExpenseFormState = {
  error?: string;
  success?: string;
};

export type PayableBillFormState = {
  error?: string;
  success?: string;
};

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

  const { count } = await supabase
    .from("family_members")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (count && count > 0) {
    return;
  }

  await supabase.from("family_members").insert(
    familyMembers.map((member) => ({
      owner_id: ownerId,
      name: member.name,
      role: member.role,
      monthly_limit: member.monthlyLimit,
      currency: member.currency,
      is_active: true,
    })),
  );

  await supabase.from("expense_categories").insert(
    expenseCategories.map((category) => ({
      owner_id: ownerId,
      name: category.name,
      is_default: true,
    })),
  );
}

export async function getFamilyMembers() {
  await seedInitialFinanceData();

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

export async function getActiveFamilyMembers() {
  const members = await getFamilyMembers();
  return members.filter((member) => member.is_active);
}

export async function getExpenseCategories() {
  await seedInitialFinanceData();

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, owner_id, name, description, is_default, created_at")
    .eq("owner_id", ownerId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbExpenseCategory[];
}

export async function getExpenses() {
  await seedInitialFinanceData();

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, owner_id, family_member_id, category_id, expense_date, description, purchase_location, amount, payment_method, bank_or_card, notes, created_at, family_members(id, name, monthly_limit), expense_categories(id, name)",
    )
    .eq("owner_id", ownerId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbExpense[];
}

export async function getExpenseDashboardData() {
  const [members, categories, expenses] = await Promise.all([
    getActiveFamilyMembers(),
    getExpenseCategories(),
    getExpenses(),
  ]);

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

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("payable_bills")
    .select(
      "id, owner_id, name, category, amount, due_date, responsible_member_id, status, bank_used, recurrence, notes, created_at, family_members(id, name)",
    )
    .eq("owner_id", ownerId)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbPayableBill[];
}

export async function getPayableBillsDashboardData() {
  const [members, bills] = await Promise.all([
    getActiveFamilyMembers(),
    getPayableBills(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const enrichedBills = bills.map((bill) => ({
    ...bill,
    computed_status:
      bill.status !== "pago" && bill.due_date < today ? "atrasado" : bill.status,
  }));

  const pendingBills = enrichedBills.filter((bill) => bill.computed_status === "pendente");
  const overdueBills = enrichedBills.filter((bill) => bill.computed_status === "atrasado");
  const paidBills = enrichedBills.filter((bill) => bill.computed_status === "pago");

  return {
    members,
    bills: enrichedBills,
    totalPending: pendingBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalOverdue: overdueBills.reduce((total, bill) => total + Number(bill.amount), 0),
    totalPaid: paidBills.reduce((total, bill) => total + Number(bill.amount), 0),
    pendingCount: pendingBills.length,
    overdueCount: overdueBills.length,
    paidCount: paidBills.length,
  };
}
