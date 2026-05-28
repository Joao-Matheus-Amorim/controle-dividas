import Stripe from "stripe";

import { getBillingPlan, type BillingPlanKey } from "@/lib/billing/plans";
import {
  assertStripeConfigurationBoundary,
  getStripePriceEnvVar,
  getStripePriceId,
} from "@/lib/billing/stripe-config";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import type { Organization } from "@/lib/organizations/types";

type StripeCheckoutSessionInput = {
  plan: BillingPlanKey;
  organization: Organization;
  customerEmail?: string | null;
  orgSlug?: string;
};

export type StripeCheckoutSessionResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      reason:
        | "checkout_disabled"
        | "stripe_not_configured"
        | "invalid_plan"
        | "missing_price"
        | "missing_checkout_url";
      missingPriceEnvVar?: string;
    };

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
}

function getSettingsReturnUrl(orgSlug?: string) {
  return getOrgPathFromProtectedPath("/protected/configuracoes", orgSlug);
}

function buildCheckoutReturnUrl(path: string, status: "success" | "cancelled") {
  return new URL(`${path}?billing_checkout=${status}`, getAppUrl()).toString();
}

export async function createStripeCheckoutSession({
  plan,
  organization,
  customerEmail,
  orgSlug,
}: StripeCheckoutSessionInput): Promise<StripeCheckoutSessionResult> {
  const billingPlan = getBillingPlan(plan);

  if (!billingPlan.isPaid) {
    return { ok: false, reason: "invalid_plan" };
  }

  const boundary = assertStripeConfigurationBoundary();

  if (!boundary.checkoutEnabled) {
    return { ok: false, reason: "checkout_disabled" };
  }

  if (!boundary.ready) {
    return { ok: false, reason: "stripe_not_configured" };
  }

  const priceId = getStripePriceId(plan);

  if (!priceId) {
    return {
      ok: false,
      reason: "missing_price",
      missingPriceEnvVar: getStripePriceEnvVar(plan) ?? undefined,
    };
  }

  const settingsPath = getSettingsReturnUrl(orgSlug);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: buildCheckoutReturnUrl(settingsPath, "success"),
    cancel_url: buildCheckoutReturnUrl(settingsPath, "cancelled"),
    client_reference_id: organization.id,
    customer: organization.stripe_customer_id ?? undefined,
    customer_email: organization.stripe_customer_id ? undefined : customerEmail ?? undefined,
    metadata: {
      organization_id: organization.id,
      organization_slug: organization.slug,
      requested_plan: plan,
    },
    subscription_data: {
      metadata: {
        organization_id: organization.id,
        organization_slug: organization.slug,
        requested_plan: plan,
      },
    },
  });

  if (!session.url) {
    return { ok: false, reason: "missing_checkout_url" };
  }

  return {
    ok: true,
    url: session.url,
  };
}
