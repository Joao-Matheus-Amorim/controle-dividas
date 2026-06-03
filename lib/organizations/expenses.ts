import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type RawExpense = Omit<DbExpense, "family_members" | "expense_categories"> & {
  family_members?: never;
  expense_categories?: never;
};

type ExpenseMemberRelation = Pick<DbFamilyMember, "id" | "name" | "monthly_limit">;
type ExpenseCategoryRelation = Pick<DbExpenseCategory, "id" | "name">;

function normalizeExpense(
  expense: RawExpense,
  membersById: Map<string, ExpenseMemberRelation>,
  categoriesById: Map<string, ExpenseCategoryRelation>,
): DbExpense {
  return {
    ...expense,
    family_members: membersById.get(expense.family_member_id) ?? null,
    expense_categories: expense.category_id
      ? categoriesById.get(expense.category_id) ?? null
      : null,
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
  const [members, categories] = await Promise.all([
    getOrganizationAccessibleMembers(orgSlug),
    getOrganizationExpenseCategories(orgSlug),
  ]);
  const scopedMemberIds = members.map((member) => member.id);

  if (scopedMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, owner_id, family_member_id, category_id, expense_date, description, purchase_location, amount, payment_method, bank_or_card, notes, created_at",
    )
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("family_member_id", scopedMemberIds)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const membersById = new Map(
    members.map((member) => [
      member.id,
      { id: member.id, name: member.name, monthly_limit: member.monthly_limit },
    ]),
  );
  const categoriesById = new Map(
    categories.map((category) => [
      category.id,
      { id: category.id, name: category.name },
    ]),
  );

  return ((data ?? []) as RawExpense[]).map((expense) =>
    normalizeExpense(expense, membersById, categoriesById),
  );
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
