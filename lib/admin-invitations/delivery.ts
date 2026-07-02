import "server-only";

import { headers } from "next/headers";

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

function getConfiguredAppUrl() {
  return env("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
}

function sanitizeOrigin(origin: string | null) {
  const value = origin?.trim().replace(/\/+$/, "");

  if (!value || (!value.startsWith("https://") && !value.startsWith("http://"))) {
    return null;
  }

  return value;
}

function getProviderUrl() {
  return env("ADMIN_INVITATION_EMAIL_WEBHOOK_URL");
}

export async function buildAdminInvitationUrl(rawToken: string) {
  const appUrl = getConfiguredAppUrl();

  if (!appUrl) {
    const requestHeaders = await headers();
    const origin = sanitizeOrigin(requestHeaders.get("origin"));

    if (origin) {
      return `${origin}/auth/convite?token=${encodeURIComponent(rawToken)}`;
    }

    const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || requestHeaders.get("host")?.split(",")[0]?.trim();

    if (!host) {
      return `/auth/convite?token=${encodeURIComponent(rawToken)}`;
    }

    const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto || (host.startsWith("localhost") ? "http" : "https");

    return `${protocol}://${host}/auth/convite?token=${encodeURIComponent(rawToken)}`;
  }

  return `${appUrl}/auth/convite?token=${encodeURIComponent(rawToken)}`;
}

async function buildProviderInvitationUrl(rawToken: string) {
  const invitationUrl = await buildAdminInvitationUrl(rawToken);

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
  const invitationUrl = await buildProviderInvitationUrl(rawToken);

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
