import { createAdminClient } from "@/lib/supabase/admin";

export async function linkAuthUserToFamilyProfile({
  authUserId,
  email,
}: {
  authUserId: string;
  email: string | null;
}) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!authUserId || !normalizedEmail) {
    return { linked: false, reason: "missing_user_or_email" };
  }

  const supabase = createAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, auth_user_id, is_active")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    return { linked: false, reason: error.message };
  }

  if (!profile) {
    return { linked: false, reason: "profile_not_found" };
  }

  if (!profile.is_active) {
    return { linked: false, reason: "profile_inactive" };
  }

  if (profile.auth_user_id && profile.auth_user_id !== authUserId) {
    return { linked: false, reason: "profile_already_linked" };
  }

  if (profile.auth_user_id === authUserId) {
    return { linked: true, reason: "already_linked" };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ auth_user_id: authUserId })
    .eq("id", profile.id);

  if (updateError) {
    return { linked: false, reason: updateError.message };
  }

  return { linked: true, reason: "linked" };
}
