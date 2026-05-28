type Env = Partial<Record<string, string | undefined>>;

const requiredOnboardingVariables = [
  "E2E_ONBOARDING_EMAIL",
  "E2E_ONBOARDING_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const requiredActiveOrganizationVariables = [
  "E2E_ACTIVE_ORG_EMAIL",
  "E2E_ACTIVE_ORG_PASSWORD",
] as const;

const requiredAdminVariables = [
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
] as const;

const requiredLimitedUserVariables = [
  "E2E_LIMITED_USER_EMAIL",
  "E2E_LIMITED_USER_PASSWORD",
] as const;

const requiredLimitedUserExpectationVariables = [
  "E2E_LIMITED_USER_HIDDEN_NAV_LABEL",
  "E2E_LIMITED_USER_DENIED_ROUTE_PATH",
] as const;

const requiredOnboardingCaseVariables = [
  "E2E_ONBOARDING_CASE_EMAIL",
  "E2E_ONBOARDING_CASE_PASSWORD",
  "E2E_ONBOARDING_CASE_SLUG",
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
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
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

export function getAdminE2eConfig(env: Env = process.env) {
  const enabled = env.RUN_ADMIN_E2E === "true";
  const missingVariables = enabled
    ? requiredAdminVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    email: env.E2E_ADMIN_EMAIL,
    password: env.E2E_ADMIN_PASSWORD,
  };
}

export function shouldRunAdminE2e(env: Env = process.env) {
  const config = getAdminE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function getLimitedUserE2eConfig(env: Env = process.env) {
  const enabled = env.RUN_LIMITED_USER_E2E === "true";
  const missingVariables = enabled
    ? requiredLimitedUserVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    email: env.E2E_LIMITED_USER_EMAIL,
    password: env.E2E_LIMITED_USER_PASSWORD,
  };
}

export function shouldRunLimitedUserE2e(env: Env = process.env) {
  const config = getLimitedUserE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function getLimitedUserExpectationE2eConfig(env: Env = process.env) {
  const config = getLimitedUserE2eConfig(env);
  const missingExpectationVariables = config.enabled
    ? requiredLimitedUserExpectationVariables.filter((key) => !env[key])
    : [];

  return {
    ...config,
    missingVariables: [...config.missingVariables, ...missingExpectationVariables],
    hiddenNavLabel: env.E2E_LIMITED_USER_HIDDEN_NAV_LABEL,
    deniedRoutePath: env.E2E_LIMITED_USER_DENIED_ROUTE_PATH,
  };
}

export function shouldRunLimitedUserExpectationE2e(env: Env = process.env) {
  const config = getLimitedUserExpectationE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function getOnboardingCaseE2eConfig(env: Env = process.env) {
  const enabled = env.RUN_ONBOARDING_CASE_E2E === "true";
  const missingVariables = enabled
    ? requiredOnboardingCaseVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    email: env.E2E_ONBOARDING_CASE_EMAIL,
    password: env.E2E_ONBOARDING_CASE_PASSWORD,
    slug: env.E2E_ONBOARDING_CASE_SLUG,
  };
}

export function shouldRunOnboardingCaseE2e(env: Env = process.env) {
  const config = getOnboardingCaseE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function createE2eSlug() {
  return `e2e-onboarding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
