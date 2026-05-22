type Env = Partial<Record<string, string | undefined>>;

const requiredDataChangingVariables = [
  "E2E_DATA_CHANGING_EMAIL",
  "E2E_DATA_CHANGING_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function getDataChangingE2eConfig(env: Env = process.env) {
  const enabled = env.RUN_DATA_CHANGING_E2E === "true";
  const missingVariables = enabled
    ? requiredDataChangingVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    email: env.E2E_DATA_CHANGING_EMAIL,
    password: env.E2E_DATA_CHANGING_PASSWORD,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function shouldRunDataChangingE2e(env: Env = process.env) {
  const config = getDataChangingE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}
