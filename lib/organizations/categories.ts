import type { DbExpenseCategory } from "@/lib/finance/types";
import { seedInitialFinanceDataForOwner } from "@/lib/finance/seed-server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

export async function getOrganizationExpenseCategories(orgSlug?: string) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);

  await seedInitialFinanceDataForOwner(
    supabase,
    organization.owner_auth_user_id,
    organization.id,
  );

  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, owner_id, parent_category_id, name, description, is_default, created_at")
    .eq("organization_id", organization.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbExpenseCategory[];
}
