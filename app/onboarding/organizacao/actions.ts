"use server";

export type InitialOrganizationOnboardingState = {
  error?: string;
  success?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeOrganizationSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function validateInitialOrganizationOnboarding(
  _prevState: InitialOrganizationOnboardingState,
  formData: FormData,
): Promise<InitialOrganizationOnboardingState> {
  const name = String(formData.get("organization_name") ?? "").trim();
  const rawSlug = String(formData.get("organization_slug") ?? "").trim();
  const slug = rawSlug ? normalizeOrganizationSlug(rawSlug) : normalizeOrganizationSlug(name);

  if (!name) {
    return { error: "Informe o nome da organização." };
  }

  if (name.length < 3) {
    return { error: "O nome da organização deve ter pelo menos 3 caracteres." };
  }

  if (!slug) {
    return { error: "Informe um slug válido para a organização." };
  }

  if (!slugPattern.test(slug)) {
    return { error: "Use apenas letras minúsculas, números e hífens no slug." };
  }

  return {
    success:
      "Validação concluída. A criação da organização será habilitada em uma próxima etapa segura.",
  };
}
