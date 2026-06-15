import "server-only";

import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import type { FinanceModuleKey, PermissionAction } from "@/lib/finance/permissions";
import type { DbFamilyMember } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

export async function getAccessibleMemberOptions(
  module: FinanceModuleKey,
  action: PermissionAction,
  orgSlug?: string,
) {
  const supabase = await createClient();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds(module, action, orgSlug);

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("organization_id", organization.id)
    .eq("is_active", true)
    .in("id", accessibleMemberIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}
