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

export type RlsTestOrganizationFixture = {
  id: string;
  slug: string;
  name: string;
};

export type RlsTestUserFixture = {
  id: string;
  email: string;
  organizationId: string;
};

export type RlsExpenseCategoryFixture = {
  id: string;
  ownerId: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  isDefault: boolean;
};

export type RlsExpenseCategoryFixtureSet = {
  prefix: string;
  organizations: {
    organizationA: RlsTestOrganizationFixture;
    organizationB: RlsTestOrganizationFixture;
  };
  users: {
    userA: RlsTestUserFixture;
    userB: RlsTestUserFixture;
  };
  categories: {
    categoryA: RlsExpenseCategoryFixture;
    categoryB: RlsExpenseCategoryFixture;
    legacyCategoryA: RlsExpenseCategoryFixture;
  };
  cleanupKeys: string[];
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

export function createExpenseCategoryFixtureSet(prefix = createRlsTestPrefix()): RlsExpenseCategoryFixtureSet {
  const organizationAId = `${prefix}_org_a`;
  const organizationBId = `${prefix}_org_b`;
  const userAId = `${prefix}_user_a`;
  const userBId = `${prefix}_user_b`;

  return {
    prefix,
    organizations: {
      organizationA: {
        id: organizationAId,
        slug: `${prefix}-org-a`,
        name: `${prefix} Organization A`,
      },
      organizationB: {
        id: organizationBId,
        slug: `${prefix}-org-b`,
        name: `${prefix} Organization B`,
      },
    },
    users: {
      userA: {
        id: userAId,
        email: `${prefix}+user-a@example.com`,
        organizationId: organizationAId,
      },
      userB: {
        id: userBId,
        email: `${prefix}+user-b@example.com`,
        organizationId: organizationBId,
      },
    },
    categories: {
      categoryA: {
        id: `${prefix}_category_a`,
        ownerId: userAId,
        organizationId: organizationAId,
        name: `${prefix} Category A`,
        description: "Category owned by organization A",
        isDefault: false,
      },
      categoryB: {
        id: `${prefix}_category_b`,
        ownerId: userBId,
        organizationId: organizationBId,
        name: `${prefix} Category B`,
        description: "Category owned by organization B",
        isDefault: false,
      },
      legacyCategoryA: {
        id: `${prefix}_legacy_category_a`,
        ownerId: userAId,
        organizationId: null,
        name: `${prefix} Legacy Category A`,
        description: "Legacy category owned by user A",
        isDefault: false,
      },
    },
    cleanupKeys: [
      prefix,
      organizationAId,
      organizationBId,
      userAId,
      userBId,
    ],
  };
}
