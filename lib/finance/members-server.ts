import type { DbFamilyMember } from "@/lib/finance/types";
import { createClient } from "@/lib/supabase/server";

const familyMemberSelectFields =
  "id, owner_id, name, role, monthly_limit, currency, is_active, created_at";

type FamilyMemberQueryBuilder = {
  select(fields: typeof familyMemberSelectFields): {
    eq(column: "owner_id", value: string): {
      eq(column: "organization_id", value: string): {
        order(column: "created_at", options: { ascending: true }): PromiseLike<{
          data: unknown[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type FamilyMemberSupabaseClient = {
  from(table: "family_members"): FamilyMemberQueryBuilder;
};

async function createFamilyMemberClient(): Promise<FamilyMemberSupabaseClient> {
  const supabase = await createClient();
  return supabase as never;
}

export async function getFamilyMembersByOwnerFromClient(
  supabase: FamilyMemberSupabaseClient,
  ownerId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("family_members")
    .select(familyMemberSelectFields)
    .eq("owner_id", ownerId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

export async function getFamilyMembersByOwner(ownerId: string, organizationId: string) {
  const supabase = await createFamilyMemberClient();
  return getFamilyMembersByOwnerFromClient(supabase, ownerId, organizationId);
}
