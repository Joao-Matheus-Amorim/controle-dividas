type Env = Partial<Record<string, string | undefined>>;

const requiredOnboardingVariables = [
  "E2E_ONBOARDING_EMAIL",
  "E2E_ONBOARDING_PASSWORD",
] as const;

const requiredActiveOrganizationVariables = [
  "E2E_ACTIVE_ORG_EMAIL",
  "E2E_ACTIVE_ORG_PASSWORD",
] as const;

export function getOnboardingE2eConfig(env: Env = process.env) {
  const enabled = env.RUN_ONBOARDING_E2E === "true";
  const missingVariables = enabled
    ? requiredOnboardingVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    email: env.E2E_ONBOARDING_EMAIL,
    password: env.E2E_ONBOARDING_PASSWORD,
  };
}

export function shouldRunOnboardingE2e(env: Env = process.env) {
  const config = getOnboardingE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function getActiveOrganizationE2eConfig(env: Env = process.env) {
  const enabled = env.RUN_ACTIVE_ORG_E2E === "true";
  const missingVariables = enabled
    ? requiredActiveOrganizationVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    email: env.E2E_ACTIVE_ORG_EMAIL,
    password: env.E2E_ACTIVE_ORG_PASSWORD,
  };
}

export function shouldRunActiveOrganizationE2e(env: Env = process.env) {
  const config = getActiveOrganizationE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function createE2eSlug() {
  return `e2e-onboarding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
