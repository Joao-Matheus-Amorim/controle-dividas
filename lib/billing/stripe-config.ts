import "server-only";

import { shouldFailFastForMissingRuntimeEnv } from "@/lib/utils";

const STRIPE_REQUIRED_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

export type StripeRequiredEnvVar = (typeof STRIPE_REQUIRED_ENV_VARS)[number];

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

