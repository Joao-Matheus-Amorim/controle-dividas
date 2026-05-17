import { describe, expect, it } from "vitest";

import { createRlsTestPrefix, getRlsTestConfig, shouldRunRlsTests } from "./helpers";

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
});
