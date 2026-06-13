import type { DbExpenseCategory } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

export async function getOrganizationExpenseCategories(orgSlug?: string) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);

  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, owner_id, name, description, is_default, created_at")
    .eq("organization_id", organization.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbExpenseCategory[];
}
