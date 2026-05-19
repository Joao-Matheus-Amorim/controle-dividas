export type BootstrapAdminProfileInput = {
  authUserId: string;
  email: string | null;
};

export function getBootstrapProfileName(email: string | null) {
  const localPart = email?.split("@")[0]?.trim();
  return localPart || "Admin";
}

export function createBootstrapAdminProfile({
  authUserId,
  email,
}: BootstrapAdminProfileInput) {
  return {
    owner_id: authUserId,
    auth_user_id: authUserId,
    name: getBootstrapProfileName(email),
    email,
    role: "admin" as const,
    is_active: true,
  };
}
