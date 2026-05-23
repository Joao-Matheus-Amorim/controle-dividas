import { findAuthorizedProfilesByEmail } from "@/lib/finance/authorized-profile-lookup";
import { createAdminClient } from "@/lib/supabase/admin";

export async function linkAuthUserToFamilyProfile({
  authUserId,
  email,
}: {
  authUserId: string;
  email: string | null;
}) {
  if (!authUserId) {
    return { linked: false, reason: "missing_user_or_email" };
  }

  let lookup: Awaited<ReturnType<typeof findAuthorizedProfilesByEmail>>;

  try {
    lookup = await findAuthorizedProfilesByEmail(email);
  } catch (error) {
    return {
      linked: false,
      reason: error instanceof Error ? error.message : "authorized_profile_lookup_failed",
    };
  }

  if (lookup.status === "missing_email") {
    return { linked: false, reason: "missing_user_or_email" };
  }

  if (lookup.status === "not_found") {
    return { linked: false, reason: "profile_not_found" };
  }

  if (lookup.status === "duplicate") {
    return { linked: false, reason: "duplicate_authorized_email" };
  }

  const profile = lookup.profile;

  if (!profile.is_active) {
    return { linked: false, reason: "profile_inactive" };
  }

  if (profile.auth_user_id && profile.auth_user_id !== authUserId) {
    return { linked: false, reason: "profile_already_linked" };
  }

  if (profile.auth_user_id === authUserId) {
    return { linked: true, reason: "already_linked" };
  }

  const supabase = createAdminClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ auth_user_id: authUserId })
    .eq("id", profile.id);

  if (updateError) {
    return { linked: false, reason: updateError.message };
  }

  return { linked: true, reason: "linked" };
}
