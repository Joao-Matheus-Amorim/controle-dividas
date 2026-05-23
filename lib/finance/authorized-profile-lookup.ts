import { createAdminClient } from "@/lib/supabase/admin";

export type AuthorizedProfileLookupRow = {
  id: string;
  owner_id: string;
  organization_id: string | null;
  auth_user_id: string | null;
  linked_family_member_id: string | null;
  name: string;
  email: string | null;
  role: "admin" | "adult" | "child" | "custom" | "user";
  is_active: boolean;
};

export type AuthorizedProfileLookupResult =
  | { status: "missing_email"; profiles: [] }
  | { status: "not_found"; profiles: [] }
  | { status: "duplicate"; profiles: AuthorizedProfileLookupRow[] }
  | { status: "single"; profile: AuthorizedProfileLookupRow; profiles: [AuthorizedProfileLookupRow] };

export function normalizeAuthorizedEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export async function findAuthorizedProfilesByEmail(
  email: string | null | undefined,
): Promise<AuthorizedProfileLookupResult> {
  const normalizedEmail = normalizeAuthorizedEmail(email);

  if (!normalizedEmail) {
    return { status: "missing_email", profiles: [] };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, owner_id, organization_id, auth_user_id, linked_family_member_id, name, email, role, is_active")
    .ilike("email", normalizedEmail)
    .limit(2);

  if (error) {
    throw new Error(error.message);
  }

  const profiles = (data ?? []) as AuthorizedProfileLookupRow[];

  if (profiles.length === 0) {
    return { status: "not_found", profiles: [] };
  }

  if (profiles.length > 1) {
    return { status: "duplicate", profiles };
  }

  return {
    status: "single",
    profile: profiles[0],
    profiles: [profiles[0]],
  };
}
