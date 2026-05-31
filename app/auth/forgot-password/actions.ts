"use server";

import { headers } from "next/headers";

import { normalizeAuthorizedEmail } from "@/lib/finance/authorized-profile-lookup";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

type PasswordResetActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const passwordResetRequestRateLimit = {
  operationKey: "auth.password_reset.request",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

function isValidPasswordResetEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordResetRateLimitActorKey(email: string) {
  if (!email) {
    return "missing-email";
  }

  if (!isValidPasswordResetEmail(email)) {
    return "invalid-email";
  }

  return email;
}

function sanitizeOrigin(origin: string | null) {
  const value = origin?.trim();

  if (!value || (!value.startsWith("https://") && !value.startsWith("http://"))) {
    return null;
  }

  return value;
}

async function getPasswordResetRedirectTo() {
  const requestHeaders = await headers();
  const origin = sanitizeOrigin(requestHeaders.get("origin"));

  if (origin) {
    return `${origin}/auth/update-password`;
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host")?.split(",")[0]?.trim();

  if (!host) {
    return undefined;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}/auth/update-password`;
}

export async function requestPasswordReset(email: unknown): Promise<PasswordResetActionResult> {
  const normalizedEmail = normalizeAuthorizedEmail(typeof email === "string" ? email : null);
  const rateLimit = checkSensitiveOperationRateLimit({
    ...passwordResetRequestRateLimit,
    actorKey: getPasswordResetRateLimitActorKey(normalizedEmail),
    organizationId: "public-auth",
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Muitas tentativas de recuperacao de senha. Tente novamente em alguns minutos.",
    };
  }

  if (!normalizedEmail) {
    return {
      success: false,
      error: "Informe o email cadastrado.",
    };
  }

  if (!isValidPasswordResetEmail(normalizedEmail)) {
    return {
      success: false,
      error: "Informe um email valido.",
    };
  }

  const supabase = await createClient();
  const redirectTo = await getPasswordResetRedirectTo();
  const { error } = await supabase.auth.resetPasswordForEmail(
    normalizedEmail,
    redirectTo ? { redirectTo } : undefined,
  );

  if (error) {
    return {
      success: false,
      error: "Nao foi possivel enviar o email de recuperacao. Confira o email informado e tente novamente.",
    };
  }

  return { success: true };
}
