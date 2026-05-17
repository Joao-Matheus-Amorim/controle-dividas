import { describe, expect, it } from "vitest";

import {
  createExpenseCategoryFixtureSet,
  createRlsSlugPrefix,
  createRlsTestPrefix,
  getRlsTestConfig,
  shouldRunRlsTests,
} from "./helpers";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const organizationSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("RLS test harness", () => {
  it("stays disabled by default so regular CI does not touch external Supabase state", () => {
    const config = getRlsTestConfig({});

    expect(config.enabled).toBe(false);
    expect(config.missingVariables).toEqual([]);
    expect(shouldRunRlsTests({})).toBe(false);
  });

  it("requires all dedicated RLS variables when explicitly enabled", () => {
    const config = getRlsTestConfig({ RUN_RLS_TESTS: "true" });

    expect(config.enabled).toBe(true);
    expect(config.missingVariables).toEqual([
      "RLS_TEST_SUPABASE_URL",
      "RLS_TEST_SUPABASE_ANON_KEY",
      "RLS_TEST_SUPABASE_SERVICE_ROLE_KEY",
      "RLS_TEST_USER_A_EMAIL",
      "RLS_TEST_USER_A_PASSWORD",
      "RLS_TEST_USER_B_EMAIL",
      "RLS_TEST_USER_B_PASSWORD",
    ]);
    expect(shouldRunRlsTests({ RUN_RLS_TESTS: "true" })).toBe(false);
  });

  it("can be enabled only with a complete dedicated environment", () => {
    const env = {
      RUN_RLS_TESTS: "true",
      RLS_TEST_SUPABASE_URL: "https://example.supabase.co",
      RLS_TEST_SUPABASE_ANON_KEY: "anon-key",
      RLS_TEST_SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      RLS_TEST_USER_A_EMAIL: "user-a@example.com",
      RLS_TEST_USER_A_PASSWORD: "password-a",
      RLS_TEST_USER_B_EMAIL: "user-b@example.com",
      RLS_TEST_USER_B_PASSWORD: "password-b",
    };

    expect(getRlsTestConfig(env).missingVariables).toEqual([]);
    expect(shouldRunRlsTests(env)).toBe(true);
  });

  it("creates a unique cleanup-safe fixture prefix", () => {
    expect(createRlsTestPrefix()).toMatch(/^rls_test_\d+_[a-z0-9]+$/);
  });

  it("creates organization-safe slug prefixes from underscored fixture prefixes", () => {
    expect(createRlsSlugPrefix("rls_test_static")).toBe("rls-test-static");
    expect(createRlsSlugPrefix("RLS__TEST__123")).toBe("rls-test-123");
  });

  it("creates an expense category fixture set for organizations A and B", () => {
    const fixture = createExpenseCategoryFixtureSet("rls_test_static");

    expect(fixture.slugPrefix).toBe("rls-test-static");
    expect(fixture.organizations.organizationA.id).not.toBe(fixture.organizations.organizationB.id);
    expect(fixture.organizations.organizationA.id).toMatch(uuidPattern);
    expect(fixture.organizations.organizationB.id).toMatch(uuidPattern);
    expect(fixture.users.userA.id).toMatch(uuidPattern);
    expect(fixture.users.userB.id).toMatch(uuidPattern);
    expect(fixture.categories.categoryA.id).toMatch(uuidPattern);
    expect(fixture.categories.categoryB.id).toMatch(uuidPattern);
    expect(fixture.categories.legacyCategoryA.id).toMatch(uuidPattern);
    expect(fixture.organizations.organizationA.slug).toMatch(organizationSlugPattern);
    expect(fixture.organizations.organizationB.slug).toMatch(organizationSlugPattern);
    expect(fixture.users.userA.organizationId).toBe(fixture.organizations.organizationA.id);
    expect(fixture.users.userB.organizationId).toBe(fixture.organizations.organizationB.id);
    expect(fixture.categories.categoryA.organizationId).toBe(fixture.organizations.organizationA.id);
    expect(fixture.categories.categoryB.organizationId).toBe(fixture.organizations.organizationB.id);
    expect(fixture.categories.legacyCategoryA.organizationId).toBeNull();
    expect(fixture.categories.legacyCategoryA.ownerId).toBe(fixture.users.userA.id);
    expect(fixture.cleanupKeys).toContain("rls_test_static");
    expect(fixture.cleanupKeys).toContain("rls-test-static");
    expect(fixture.cleanupKeys).toContain(fixture.organizations.organizationA.id);
    expect(fixture.cleanupKeys).toContain(fixture.organizations.organizationB.id);
  });
});
