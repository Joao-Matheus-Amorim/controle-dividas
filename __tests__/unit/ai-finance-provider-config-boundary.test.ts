import { afterEach, describe, expect, it } from "vitest";

import {
  assertAiFinanceProviderConfigurationBoundary,
  getAiFinanceProviderConfigurationBoundary,
  getMissingAiFinanceProviderEnvVars,
  isAiFinanceProviderEnabled,
} from "@/lib/finance/ai-finance-provider-config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  delete process.env.ENABLE_AI_FINANCE_PROVIDER;
  delete process.env.AI_FINANCE_PROVIDER;
  delete process.env.AI_FINANCE_MODEL;
  delete process.env.AI_FINANCE_PROVIDER_API_KEY;
  process.env.APP_ENV = "local";
});

describe("AI finance provider configuration boundary", () => {
  it("stays disabled and does not require provider env by default", () => {
    expect(isAiFinanceProviderEnabled()).toBe(false);
    expect(getAiFinanceProviderConfigurationBoundary()).toEqual({
      providerEnabled: false,
      ready: false,
      missingEnvVars: [],
    });
  });

  it("reports missing server-side provider env when explicitly enabled", () => {
    process.env.ENABLE_AI_FINANCE_PROVIDER = "true";

    expect(getMissingAiFinanceProviderEnvVars()).toEqual([
      "AI_FINANCE_PROVIDER",
      "AI_FINANCE_MODEL",
      "AI_FINANCE_PROVIDER_API_KEY",
    ]);
    expect(getAiFinanceProviderConfigurationBoundary()).toEqual({
      providerEnabled: true,
      ready: false,
      missingEnvVars: [
        "AI_FINANCE_PROVIDER",
        "AI_FINANCE_MODEL",
        "AI_FINANCE_PROVIDER_API_KEY",
      ],
    });
  });

  it("is ready only when all provider env values are present", () => {
    process.env.ENABLE_AI_FINANCE_PROVIDER = "true";
    process.env.AI_FINANCE_PROVIDER = "test-provider";
    process.env.AI_FINANCE_MODEL = "test-model";
    process.env.AI_FINANCE_PROVIDER_API_KEY = "test-key";

    expect(assertAiFinanceProviderConfigurationBoundary()).toEqual({
      providerEnabled: true,
      ready: true,
      missingEnvVars: [],
    });
  });

  it("fails fast in production-like runtime when enabled without configuration", () => {
    process.env.ENABLE_AI_FINANCE_PROVIDER = "true";
    process.env.APP_ENV = "production";

    expect(() => assertAiFinanceProviderConfigurationBoundary()).toThrow(
      "AI finance provider runtime environment variables are missing.",
    );
  });
});
