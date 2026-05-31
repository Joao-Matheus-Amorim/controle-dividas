"use server";

import { headers } from "next/headers";

import {
  findAuthorizedProfilesByEmail,
  normalizeAuthorizedEmail,
} from "@/lib/finance/authorized-profile-lookup";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

const signupAuthorizedEmailRateLimit = {
  operationKey: "auth.signup.authorized_email.check",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

const signupSubmitRateLimit = {
  operationKey: "auth.signup.submit",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

function isValidSignupEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSignupRateLimitActorKey(email: string) {
  if (!email) {
    return "missing-email";
  }

  if (!isValidSignupEmail(email)) {
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

async function getSignupEmailRedirectTo() {
  const requestHeaders = await headers();
  const origin = sanitizeOrigin(requestHeaders.get("origin"));

  if (origin) {
    return `${origin}/auth/confirm?next=/protected`;
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host")?.split(",")[0]?.trim();

  if (!host) {
    return undefined;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}/auth/confirm?next=/protected`;
}

export async function checkAuthorizedFamilyEmail(email: unknown) {
  const normalizedEmail = normalizeAuthorizedEmail(typeof email === "string" ? email : null);
  const rateLimit = checkSensitiveOperationRateLimit({
    ...signupAuthorizedEmailRateLimit,
    actorKey: normalizedEmail || "missing-email",
    organizationId: "public-auth",
  });

  if (!rateLimit.allowed) {
    return {
      allowed: false,
      error: "Muitas tentativas de validacao de email. Tente novamente em alguns minutos.",
    };
  }

  return getAuthorizedSignupProfile(normalizedEmail);
}

async function getAuthorizedSignupProfile(normalizedEmail: string) {
  let lookup: Awaited<ReturnType<typeof findAuthorizedProfilesByEmail>>;

  try {
    lookup = await findAuthorizedProfilesByEmail(normalizedEmail);
  } catch (error) {
    return {
      allowed: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel validar este email autorizado agora. Tente novamente.",
    };
  }

  if (lookup.status === "missing_email") {
    return { allowed: false, error: "Informe o email autorizado pelo Admin." };
  }

  if (lookup.status === "not_found") {
    return { allowed: false, error: "Este email ainda nao foi autorizado pelo Admin familiar." };
  }

  if (lookup.status === "duplicate") {
    return {
      allowed: false,
      error: "Este email esta autorizado em mais de uma organizacao. Fale com o Admin familiar para corrigir o acesso.",
    };
  }

  const profile = lookup.profile;

  if (!profile.is_active) {
    return { allowed: false, error: "Este acesso esta bloqueado. Fale com o Admin familiar." };
  }

  if (profile.auth_user_id) {
    return { allowed: false, error: "Este email ja possui acesso ativo. Use a tela de entrada." };
  }

  return { allowed: true, name: profile.name, role: profile.role };
}

export async function createAuthorizedFamilyAccess(email: unknown, password: unknown) {
  const normalizedEmail = normalizeAuthorizedEmail(typeof email === "string" ? email : null);
  const rateLimit = checkSensitiveOperationRateLimit({
    ...signupSubmitRateLimit,
    actorKey: getSignupRateLimitActorKey(normalizedEmail),
    organizationId: "public-auth",
  });

  if (!rateLimit.allowed) {
    return {
      allowed: false,
      error: "Muitas tentativas de criacao de acesso. Tente novamente em alguns minutos.",
    };
  }

  if (!normalizedEmail) {
    return { allowed: false, error: "Informe o email autorizado pelo Admin." };
  }

  if (!isValidSignupEmail(normalizedEmail)) {
    return { allowed: false, error: "Informe um email valido." };
  }

  if (typeof password !== "string" || !password) {
    return { allowed: false, error: "Informe a senha." };
  }

  const authorization = await getAuthorizedSignupProfile(normalizedEmail);

  if (!authorization.allowed) {
    return authorization;
  }

  const supabase = await createClient();
  const emailRedirectTo = await getSignupEmailRedirectTo();
  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });

  if (error) {
    return {
      allowed: false,
      error: error.message,
    };
  }

  return authorization;
}
