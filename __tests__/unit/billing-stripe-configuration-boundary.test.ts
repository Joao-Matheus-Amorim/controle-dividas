import { afterEach, describe, expect, it } from "vitest";

import {
  assertStripeConfigurationBoundary,
  getMissingStripeEnvVars,
  getStripeConfigurationBoundary,
  isStripeCheckoutEnabled,
} from "@/lib/billing/stripe-config";

const originalEnv = { ...process.env };

function resetStripeEnv() {
  process.env = { ...originalEnv };
  delete process.env.ENABLE_STRIPE_CHECKOUT;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.APP_ENV;
  process.env.NODE_ENV = "test";
}

afterEach(() => {
  resetStripeEnv();
});

describe("billing stripe configuration boundary", () => {
  it("keeps Stripe runtime disabled by default", () => {
    resetStripeEnv();

    expect(isStripeCheckoutEnabled()).toBe(false);
    expect(getStripeConfigurationBoundary()).toEqual({
      checkoutEnabled: false,
      ready: false,
      missingEnvVars: [],
    });
  });

  it("lists missing required Stripe runtime env vars when checkout is enabled", () => {
    resetStripeEnv();
    process.env.ENABLE_STRIPE_CHECKOUT = "true";

    expect(getMissingStripeEnvVars()).toEqual([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_APP_URL",
    ]);

    expect(getStripeConfigurationBoundary()).toEqual({
      checkoutEnabled: true,
      ready: false,
      missingEnvVars: [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_APP_URL",
      ],
    });
  });

  it("becomes ready when all required Stripe runtime env vars are set", () => {
    resetStripeEnv();
    process.env.ENABLE_STRIPE_CHECKOUT = "true";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    expect(getMissingStripeEnvVars()).toEqual([]);
    expect(getStripeConfigurationBoundary()).toEqual({
      checkoutEnabled: true,
      ready: true,
      missingEnvVars: [],
    });
  });

  it("fails fast in production-like runtime when checkout is enabled and env vars are missing", () => {
    resetStripeEnv();
    process.env.ENABLE_STRIPE_CHECKOUT = "true";
    process.env.NODE_ENV = "production";

    expect(() => assertStripeConfigurationBoundary()).toThrow(
      "Stripe runtime environment variables are missing.",
    );
  });
});

