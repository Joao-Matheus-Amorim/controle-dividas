"use server";

import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

type PasswordUpdateActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const passwordUpdateSubmitRateLimit = {
  operationKey: "auth.password_update.submit",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

function getPasswordUpdateRateLimitActorKey(userId: unknown) {
  return typeof userId === "string" && userId ? userId : "missing-session";
}

export async function updatePassword(password: unknown): Promise<PasswordUpdateActionResult> {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const rateLimit = checkSensitiveOperationRateLimit({
    ...passwordUpdateSubmitRateLimit,
    actorKey: getPasswordUpdateRateLimitActorKey(userId),
    organizationId: "public-auth",
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Muitas tentativas de atualizacao de senha. Tente novamente em alguns minutos.",
    };
  }

  if (claimsError || !userId) {
    return {
      success: false,
      error: "Sessao de recuperacao expirada. Solicite um novo link de recuperacao.",
    };
  }

  if (typeof password !== "string" || password.length < 6) {
    return {
      success: false,
      error: "A nova senha precisa ter pelo menos 6 caracteres.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      error: "Nao foi possivel atualizar a senha. Tente novamente.",
    };
  }

  return { success: true };
}
