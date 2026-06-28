"use server";

import { redirect } from "next/navigation";

import { recordAuditEvent, type AuditEventOutcome } from "@/lib/audit/events";
import { createStripeCheckoutSession } from "@/lib/billing/stripe-checkout";
import { createStripeBillingPortalSession } from "@/lib/billing/stripe-portal";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import { requireOrganizationAdmin } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { BillingPlanKey } from "@/lib/billing/plans";

const billingCheckoutRateLimit = {
  operationKey: "billing.checkout.start",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

const billingPortalRateLimit = {
  operationKey: "billing.portal.start",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

async function getCurrentUserEmail() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  return typeof email === "string" ? email : null;
}

function redirectToSettings(orgSlug: string | undefined, status: string) {
  const path = getOrgPathFromProtectedPath("/protected/configuracoes", orgSlug);

  redirect(`${path}?billing_checkout=${encodeURIComponent(status)}`);
}

function redirectToPortalStatus(orgSlug: string | undefined, status: string) {
  const path = getOrgPathFromProtectedPath("/protected/configuracoes", orgSlug);

  redirect(`${path}?billing_portal=${encodeURIComponent(status)}`);
}

function getCheckoutAuditOutcome(status: string): AuditEventOutcome {
  return status === "invalid_plan" ? "validation_error" : "failure";
}

async function recordBillingCheckoutAuditEvent({
  organizationId,
  action,
  outcome,
  plan,
  status,
  missingPriceEnvVar,
}: {
  organizationId: string;
  action: "billing.checkout.start" | "billing.checkout.failed";
  outcome: AuditEventOutcome;
  plan: BillingPlanKey;
  status: string;
  missingPriceEnvVar?: string;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "billing_checkout",
    outcome,
    metadata: {
      plan,
      status,
      missing_price_env_var: missingPriceEnvVar ?? null,
    },
  });
}

async function recordBillingPortalAuditEvent({
  organizationId,
  action,
  outcome,
  status,
}: {
  organizationId: string;
  action: "billing.portal.start" | "billing.portal.failed";
  outcome: AuditEventOutcome;
  status: string;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "billing_portal",
    outcome,
    metadata: {
      status,
    },
  });
}

export async function startBillingCheckout(
  plan: BillingPlanKey,
  orgSlug?: string,
): Promise<void> {
  const { organization, membership } = await requireOrganizationAdmin(orgSlug);
  const rateLimit = checkSensitiveOperationRateLimit({
    ...billingCheckoutRateLimit,
    actorKey: membership.auth_user_id,
    organizationId: organization.id,
    targetKey: plan,
  });

  if (!rateLimit.allowed) {
    await recordBillingCheckoutAuditEvent({
      organizationId: organization.id,
      action: "billing.checkout.failed",
      outcome: "denied",
      plan,
      status: "rate_limited",
    });

    return redirectToSettings(orgSlug, "rate_limited");
  }

  const customerEmail = await getCurrentUserEmail();
  const session = await createStripeCheckoutSession({
    plan,
    organization,
    customerEmail,
    orgSlug,
  });

  if (session.ok) {
    await recordBillingCheckoutAuditEvent({
      organizationId: organization.id,
      action: "billing.checkout.start",
      outcome: "success",
      plan,
      status: "session_created",
    });

    return redirect(session.url);
  }

  await recordBillingCheckoutAuditEvent({
    organizationId: organization.id,
    action: "billing.checkout.failed",
    outcome: getCheckoutAuditOutcome(session.reason),
    plan,
    status: session.reason,
    missingPriceEnvVar: session.missingPriceEnvVar,
  });

  return redirectToSettings(orgSlug, session.reason);
}

export async function startBillingPortal(orgSlug?: string): Promise<void> {
  const { organization, membership } = await requireOrganizationAdmin(orgSlug);
  const rateLimit = checkSensitiveOperationRateLimit({
    ...billingPortalRateLimit,
    actorKey: membership.auth_user_id,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordBillingPortalAuditEvent({
      organizationId: organization.id,
      action: "billing.portal.failed",
      outcome: "denied",
      status: "rate_limited",
    });

    return redirectToPortalStatus(orgSlug, "rate_limited");
  }

  const session = await createStripeBillingPortalSession({
    organization,
    orgSlug,
  });

  if (session.ok) {
    await recordBillingPortalAuditEvent({
      organizationId: organization.id,
      action: "billing.portal.start",
      outcome: "success",
      status: "session_created",
    });

    return redirect(session.url);
  }

  await recordBillingPortalAuditEvent({
    organizationId: organization.id,
    action: "billing.portal.failed",
    outcome: "failure",
    status: session.reason,
  });

  return redirectToPortalStatus(orgSlug, session.reason);
}
