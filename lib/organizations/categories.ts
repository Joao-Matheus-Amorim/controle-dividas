import type { DbExpenseCategory } from "@/lib/finance/server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

async function getCurrentAuthUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    throw new Error("Usuario autenticado nao encontrado.");
  }

  return String(data.claims.sub);
}

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

export async function getManageableOrganizationExpenseCategories(orgSlug?: string) {
  const supabase = await createClient();
  const currentUserId = await getCurrentAuthUserId();
  const { organization } = await requireOrganizationAccess(orgSlug);

  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, owner_id, name, description, is_default, created_at")
    .eq("owner_id", currentUserId)
    .eq("organization_id", organization.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbExpenseCategory[];
}
