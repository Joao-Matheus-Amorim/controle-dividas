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
  slugPrefix: string;
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

type RlsTestEnv = Partial<Record<string, string | undefined>>;

export function getRlsTestConfig(env: RlsTestEnv = process.env): RlsTestConfig {
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

export function shouldRunRlsTests(env: RlsTestEnv = process.env) {
  const config = getRlsTestConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}

export function createRlsTestPrefix() {
  return `rls_test_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createRlsSlugPrefix(prefix: string) {
  return prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createFixtureUuid() {
  return crypto.randomUUID();
}

export function createExpenseCategoryFixtureSet(prefix = createRlsTestPrefix()): RlsExpenseCategoryFixtureSet {
  const slugPrefix = createRlsSlugPrefix(prefix);
  const organizationAId = createFixtureUuid();
  const organizationBId = createFixtureUuid();
  const userAId = createFixtureUuid();
  const userBId = createFixtureUuid();

  return {
    prefix,
    slugPrefix,
    organizations: {
      organizationA: {
        id: organizationAId,
        slug: `${slugPrefix}-org-a`,
        name: `${prefix} Organization A`,
      },
      organizationB: {
        id: organizationBId,
        slug: `${slugPrefix}-org-b`,
        name: `${prefix} Organization B`,
      },
    },
    users: {
      userA: {
        id: userAId,
        email: `${slugPrefix}+user-a@example.com`,
        organizationId: organizationAId,
      },
      userB: {
        id: userBId,
        email: `${slugPrefix}+user-b@example.com`,
        organizationId: organizationBId,
      },
    },
    categories: {
      categoryA: {
        id: createFixtureUuid(),
        ownerId: userAId,
        organizationId: organizationAId,
        name: `${prefix} Category A`,
        description: "Category owned by organization A",
        isDefault: false,
      },
      categoryB: {
        id: createFixtureUuid(),
        ownerId: userBId,
        organizationId: organizationBId,
        name: `${prefix} Category B`,
        description: "Category owned by organization B",
        isDefault: false,
      },
      legacyCategoryA: {
        id: createFixtureUuid(),
        ownerId: userAId,
        organizationId: null,
        name: `${prefix} Legacy Category A`,
        description: "Legacy category owned by user A",
        isDefault: false,
      },
    },
    cleanupKeys: [
      prefix,
      slugPrefix,
      organizationAId,
      organizationBId,
      userAId,
      userBId,
    ],
  };
}
