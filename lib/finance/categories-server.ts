import type { DbExpenseCategory } from "@/lib/finance/types";
import { createClient } from "@/lib/supabase/server";

const expenseCategorySelectFields =
  "id, owner_id, name, description, is_default, created_at";

type ExpenseCategoryQueryBuilder = {
  select(fields: typeof expenseCategorySelectFields): {
    eq(column: "owner_id", value: string): {
      eq(column: "organization_id", value: string): {
        order(column: "name", options: { ascending: true }): PromiseLike<{
          data: unknown[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type ExpenseCategorySupabaseClient = {
  from(table: "expense_categories"): ExpenseCategoryQueryBuilder;
};

async function createExpenseCategoryClient(): Promise<ExpenseCategorySupabaseClient> {
  const supabase = await createClient();
  return supabase as never;
}

export async function getExpenseCategoriesByOwnerFromClient(
  supabase: ExpenseCategorySupabaseClient,
  ownerId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("expense_categories")
    .select(expenseCategorySelectFields)
    .eq("owner_id", ownerId)
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbExpenseCategory[];
}

export async function getExpenseCategoriesByOwner(ownerId: string, organizationId: string) {
  const supabase = await createExpenseCategoryClient();
  return getExpenseCategoriesByOwnerFromClient(supabase, ownerId, organizationId);
}
