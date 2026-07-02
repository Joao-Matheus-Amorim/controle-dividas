import "server-only";

type DeliveryResult =
  | { delivered: true }
  | { delivered: false; reason: "delivery_disabled" | "missing_configuration" | "provider_error" };

type SendAdminInvitationEmailInput = {
  invitationId: string;
  invitedEmail: string;
  organizationSlug: string;
  role: string;
  rawToken: string;
  expiresAt: string;
};

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function isAdminInvitationEmailDeliveryEnabled() {
  return env("ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY") === "true";
}

function getAppUrl() {
  return env("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
}

function getProviderUrl() {
  return env("ADMIN_INVITATION_EMAIL_WEBHOOK_URL");
}

export function buildAdminInvitationUrl(rawToken: string) {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return `/auth/convite?token=${encodeURIComponent(rawToken)}`;
  }

  return `${appUrl}/auth/convite?token=${encodeURIComponent(rawToken)}`;
}

function buildProviderInvitationUrl(rawToken: string) {
  const invitationUrl = buildAdminInvitationUrl(rawToken);

  return invitationUrl.startsWith("http") ? invitationUrl : null;
}

export async function sendAdminInvitationEmail({
  invitationId,
  invitedEmail,
  organizationSlug,
  role,
  rawToken,
  expiresAt,
}: SendAdminInvitationEmailInput): Promise<DeliveryResult> {
  if (!isAdminInvitationEmailDeliveryEnabled()) {
    return { delivered: false, reason: "delivery_disabled" };
  }

  const providerUrl = getProviderUrl();
  const invitationUrl = buildProviderInvitationUrl(rawToken);

  if (!providerUrl || !invitationUrl) {
    return { delivered: false, reason: "missing_configuration" };
  }

  const response = await fetch(providerUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      invitationId,
      invitedEmail,
      invitationUrl,
      organizationSlug,
      role,
      expiresAt,
    }),
  }).catch(() => null);

  if (!response?.ok) {
    return { delivered: false, reason: "provider_error" };
  }

  return { delivered: true };
}
