import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import { firstRelation, type MaybeArray } from "@/lib/finance/relations";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

const expenseSelectFields =
  "id, owner_id, family_member_id, category_id, expense_date, description, purchase_location, amount, payment_method, bank_or_card, notes, created_at, family_members(id, name, monthly_limit), expense_categories(id, name, parent_category_id)";

type RawExpense = Omit<DbExpense, "family_members" | "expense_categories"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name" | "monthly_limit">>;
  expense_categories: MaybeArray<Pick<DbExpenseCategory, "id" | "name" | "parent_category_id">>;
};

type LegacyOrganizationScope = {
  owner_id: string;
  organization_id: string;
};

type ExpenseQueryBuilder = {
  select(fields: typeof expenseSelectFields): {
    eq(column: "owner_id", value: string): {
      eq(column: "organization_id", value: string): {
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
  scope: LegacyOrganizationScope,
  accessibleMemberIds: string[],
) {
  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("expenses")
    .select(expenseSelectFields)
    .eq("owner_id", scope.owner_id)
    .eq("organization_id", scope.organization_id)
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
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("GASTOS", "can_view");

  return getExpensesFromClient(
    supabase,
    { owner_id: organization.owner_auth_user_id, organization_id: organization.id },
    accessibleMemberIds,
  );
}
