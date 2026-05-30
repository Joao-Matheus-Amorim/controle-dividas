"use server";

import {
  findAuthorizedProfilesByEmail,
  normalizeAuthorizedEmail,
} from "@/lib/finance/authorized-profile-lookup";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";

const signupAuthorizedEmailRateLimit = {
  operationKey: "auth.signup.authorized_email.check",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

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
