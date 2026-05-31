import Stripe from "stripe";

import { assertStripeConfigurationBoundary } from "@/lib/billing/stripe-config";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import type { Organization } from "@/lib/organizations/types";

type StripeBillingPortalSessionInput = {
  organization: Organization;
  orgSlug?: string;
};

export type StripeBillingPortalSessionResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      reason:
        | "portal_disabled"
        | "stripe_not_configured"
        | "missing_customer"
        | "missing_portal_url";
    };

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
}

function buildPortalReturnUrl(orgSlug?: string) {
  const path = getOrgPathFromProtectedPath("/protected/configuracoes", orgSlug);

  return new URL(`${path}?billing_portal=returned`, getAppUrl()).toString();
}

export async function createStripeBillingPortalSession({
  organization,
  orgSlug,
}: StripeBillingPortalSessionInput): Promise<StripeBillingPortalSessionResult> {
  const boundary = assertStripeConfigurationBoundary();

  if (!boundary.checkoutEnabled) {
    return { ok: false, reason: "portal_disabled" };
  }

  if (!boundary.ready) {
    return { ok: false, reason: "stripe_not_configured" };
  }

  if (!organization.stripe_customer_id) {
    return { ok: false, reason: "missing_customer" };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: buildPortalReturnUrl(orgSlug),
  });

  if (!session.url) {
    return { ok: false, reason: "missing_portal_url" };
  }

  return {
    ok: true,
    url: session.url,
  };
}
