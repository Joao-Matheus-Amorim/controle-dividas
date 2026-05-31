"use server";

import { normalizeAuthorizedEmail } from "@/lib/finance/authorized-profile-lookup";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

type LoginActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const loginPasswordRateLimit = {
  operationKey: "auth.login.password",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

function isValidLoginEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getLoginRateLimitActorKey(email: string) {
  if (!email) {
    return "missing-email";
  }

  if (!isValidLoginEmail(email)) {
    return "invalid-email";
  }

  return email;
}

export async function loginWithPassword(email: unknown, password: unknown): Promise<LoginActionResult> {
  const normalizedEmail = normalizeAuthorizedEmail(typeof email === "string" ? email : null);
  const rateLimit = checkSensitiveOperationRateLimit({
    ...loginPasswordRateLimit,
    actorKey: getLoginRateLimitActorKey(normalizedEmail),
    organizationId: "public-auth",
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Muitas tentativas de entrada. Tente novamente em alguns minutos.",
    };
  }

  if (!normalizedEmail) {
    return {
      success: false,
      error: "Informe o email.",
    };
  }

  if (!isValidLoginEmail(normalizedEmail)) {
    return {
      success: false,
      error: "Informe um email valido.",
    };
  }

  if (typeof password !== "string" || !password) {
    return {
      success: false,
      error: "Informe a senha.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Email ou senha invalidos.",
    };
  }

  return { success: true };
}
