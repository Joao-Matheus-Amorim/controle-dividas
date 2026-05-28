import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type MaybeArray<T> = T | T[] | null;

type RawExpense = Omit<DbExpense, "family_members" | "expense_categories"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name" | "monthly_limit">>;
  expense_categories: MaybeArray<Pick<DbExpenseCategory, "id" | "name">>;
};

function firstRelation<T>(relation: MaybeArray<T>): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function normalizeExpense(expense: RawExpense): DbExpense {
  return {
    ...expense,
    family_members: firstRelation(expense.family_members),
    expense_categories: firstRelation(expense.expense_categories),
  };
}

async function getOrganizationAccessibleMembers(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("GASTOS", "can_view", orgSlug);

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("id", accessibleMemberIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

export async function getOrganizationExpenseCategories(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);

  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, owner_id, name, description, is_default, created_at")
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbExpenseCategory[];
}

export async function getOrganizationExpenses(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const members = await getOrganizationAccessibleMembers(orgSlug);
  const scopedMemberIds = members.map((member) => member.id);

  if (scopedMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, owner_id, family_member_id, category_id, expense_date, description, purchase_location, amount, payment_method, bank_or_card, notes, created_at, family_members(id, name, monthly_limit), expense_categories(id, name)",
    )
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("family_member_id", scopedMemberIds)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawExpense[]).map(normalizeExpense);
}

export async function getOrganizationExpenseDashboardData(orgSlug?: string) {
  const [allMembers, categories, expenses] = await Promise.all([
    getOrganizationAccessibleMembers(orgSlug),
    getOrganizationExpenseCategories(orgSlug),
    getOrganizationExpenses(orgSlug),
  ]);

  const members = allMembers.filter((member) => member.is_active);

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
