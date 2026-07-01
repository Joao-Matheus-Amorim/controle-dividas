"use server";

import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { seedInitialFinanceData } from "@/lib/finance/server";
import { createClient } from "@/lib/supabase/server";

export type InitialOrganizationOnboardingState = {
  error?: string;
  success?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const initialOrganizationOnboardingRateLimit = {
  operationKey: "onboarding.organization.create",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

function normalizeOrganizationSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getOnboardingErrorMessage(message: string) {
  if (message.toLowerCase().includes("duplicate key value")) {
    return "Este identificador do link ja esta em uso.";
  }

  return message;
}

export async function createInitialOrganizationFromOnboarding(
  _prevState: InitialOrganizationOnboardingState,
  formData: FormData,
): Promise<InitialOrganizationOnboardingState> {
  const name = String(formData.get("organization_name") ?? "").trim();
  const rawSlug = String(formData.get("organization_slug") ?? "").trim();
  const slug = rawSlug ? normalizeOrganizationSlug(rawSlug) : normalizeOrganizationSlug(name);

  if (!name) {
    return { error: "Informe o nome do espaco financeiro." };
  }

  if (name.length < 3) {
    return { error: "O nome do espaco financeiro deve ter pelo menos 3 caracteres." };
  }

  if (!slug) {
    return { error: "Informe um identificador do link valido para o espaco financeiro." };
  }

  if (!slugPattern.test(slug)) {
    return { error: "Use apenas letras minusculas, numeros e hifens no identificador do link." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const actorKey = data?.claims?.sub ? String(data.claims.sub) : "missing-session";
  const rateLimit = checkSensitiveOperationRateLimit({
    ...initialOrganizationOnboardingRateLimit,
    actorKey,
    organizationId: "onboarding",
  });

  if (!rateLimit.allowed) {
    return {
      error: "Muitas tentativas de criacao de espaco financeiro. Tente novamente em alguns minutos.",
    };
  }

  const { error } = await supabase.rpc("create_initial_organization_onboarding", {
    p_name: name,
    p_slug: slug,
  });

  if (error) {
    return { error: getOnboardingErrorMessage(error.message) };
  }

  await seedInitialFinanceData();

  return { success: "Espaco financeiro criado com sucesso." };
}
