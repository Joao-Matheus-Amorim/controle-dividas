import { shouldFailFastForMissingRuntimeEnv } from "@/lib/utils";

import type { BillingPlanKey } from "./plans";

const STRIPE_REQUIRED_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

export type StripeRequiredEnvVar = (typeof STRIPE_REQUIRED_ENV_VARS)[number];

export const STRIPE_PRICE_ENV_BY_PLAN = {
  family_basic: "STRIPE_PRICE_FAMILY_BASIC",
  family_plus: "STRIPE_PRICE_FAMILY_PLUS",
  family_pro: "STRIPE_PRICE_FAMILY_PRO",
} as const satisfies Record<Exclude<BillingPlanKey, "free">, string>;

export type StripePriceEnvVar =
  (typeof STRIPE_PRICE_ENV_BY_PLAN)[keyof typeof STRIPE_PRICE_ENV_BY_PLAN];

export type StripeConfigurationBoundary = {
  checkoutEnabled: boolean;
  ready: boolean;
  missingEnvVars: StripeRequiredEnvVar[];
};

function readEnvValue(name: StripeRequiredEnvVar) {
  return process.env[name]?.trim() ?? "";
}

export function isStripeCheckoutEnabled() {
  return process.env.ENABLE_STRIPE_CHECKOUT === "true";
}

export function getStripePriceEnvVar(plan: BillingPlanKey): StripePriceEnvVar | null {
  return plan === "free" ? null : STRIPE_PRICE_ENV_BY_PLAN[plan];
}

export function getStripePriceId(plan: BillingPlanKey) {
  const envVar = getStripePriceEnvVar(plan);

  if (!envVar) {
    return null;
  }

  return process.env[envVar]?.trim() || null;
}

export function getMissingStripeEnvVars() {
  return STRIPE_REQUIRED_ENV_VARS.filter((name) => readEnvValue(name).length === 0);
}

export function getStripeConfigurationBoundary(): StripeConfigurationBoundary {
  const checkoutEnabled = isStripeCheckoutEnabled();

  if (!checkoutEnabled) {
    return {
      checkoutEnabled: false,
      ready: false,
      missingEnvVars: [],
    };
  }

  const missingEnvVars = getMissingStripeEnvVars();

  return {
    checkoutEnabled: true,
    ready: missingEnvVars.length === 0,
    missingEnvVars,
  };
}

export function assertStripeConfigurationBoundary() {
  const boundary = getStripeConfigurationBoundary();

  if (!boundary.checkoutEnabled) {
    return boundary;
  }

  if (!boundary.ready && shouldFailFastForMissingRuntimeEnv()) {
    throw new Error(
      `Stripe runtime environment variables are missing. Set ${boundary.missingEnvVars.join(", ")}.`,
    );
  }

  return boundary;
}
