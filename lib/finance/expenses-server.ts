import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import { firstRelation, type MaybeArray } from "@/lib/finance/relations";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";
import { createClient } from "@/lib/supabase/server";

const expenseSelectFields =
  "id, owner_id, family_member_id, category_id, expense_date, description, purchase_location, amount, payment_method, bank_or_card, notes, created_at, family_members(id, name, monthly_limit), expense_categories(id, name)";

type RawExpense = Omit<DbExpense, "family_members" | "expense_categories"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name" | "monthly_limit">>;
  expense_categories: MaybeArray<Pick<DbExpenseCategory, "id" | "name">>;
};

type ExpenseProfile = {
  owner_id: string;
};

type ExpenseQueryBuilder = {
  select(fields: typeof expenseSelectFields): {
    eq(column: "owner_id", value: string): {
      in(column: "family_member_id", values: string[]): {
        order(
          column: "expense_date",
          options: { ascending: false },
        ): {
          order(
            column: "created_at",
            options: { ascending: false },
          ): PromiseLike<{
            data: unknown[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type ExpenseSupabaseClient = {
  from(table: "expenses"): ExpenseQueryBuilder;
};

async function createExpenseClient(): Promise<ExpenseSupabaseClient> {
  const supabase = await createClient();
  return supabase as never;
}

function normalizeExpense(expense: RawExpense): DbExpense {
  return {
    ...expense,
    family_members: firstRelation(expense.family_members),
    expense_categories: firstRelation(expense.expense_categories),
  };
}

export async function getExpensesFromClient(
  supabase: ExpenseSupabaseClient,
  profile: ExpenseProfile,
  accessibleMemberIds: string[],
) {
  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("expenses")
    .select(expenseSelectFields)
    .eq("owner_id", profile.owner_id)
    .in("family_member_id", accessibleMemberIds)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawExpense[]).map(normalizeExpense);
}

export async function getExpensesForCurrentProfile() {
  const supabase = await createExpenseClient();
  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("GASTOS", "can_view");

  return getExpensesFromClient(supabase, profile, accessibleMemberIds);
}
