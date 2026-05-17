export type RlsTestConfig = {
  enabled: boolean;
  missingVariables: string[];
  supabaseUrl?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  userAEmail?: string;
  userAPassword?: string;
  userBEmail?: string;
  userBPassword?: string;
};

const requiredVariables = [
  "RLS_TEST_SUPABASE_URL",
  "RLS_TEST_SUPABASE_ANON_KEY",
  "RLS_TEST_SUPABASE_SERVICE_ROLE_KEY",
  "RLS_TEST_USER_A_EMAIL",
  "RLS_TEST_USER_A_PASSWORD",
  "RLS_TEST_USER_B_EMAIL",
  "RLS_TEST_USER_B_PASSWORD",
] as const;

export function getRlsTestConfig(env: NodeJS.ProcessEnv = process.env): RlsTestConfig {
  const enabled = env.RUN_RLS_TESTS === "true";
  const missingVariables = enabled
    ? requiredVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    supabaseUrl: env.RLS_TEST_SUPABASE_URL,
    anonKey: env.RLS_TEST_SUPABASE_ANON_KEY,
    serviceRoleKey: env.RLS_TEST_SUPABASE_SERVICE_ROLE_KEY,
    userAEmail: env.RLS_TEST_USER_A_EMAIL,
    userAPassword: env.RLS_TEST_USER_A_PASSWORD,
    userBEmail: env.RLS_TEST_USER_B_EMAIL,
    userBPassword: env.RLS_TEST_USER_B_PASSWORD,
  };
}

export function shouldRunRlsTests(env: NodeJS.ProcessEnv = process.env) {
  const config = getRlsTestConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function createRlsTestPrefix() {
  return `rls_test_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
