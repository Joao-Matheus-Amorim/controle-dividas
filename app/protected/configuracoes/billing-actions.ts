"use server";

import { redirect } from "next/navigation";

import { recordAuditEvent, type AuditEventOutcome } from "@/lib/audit/events";
import { createStripeCheckoutSession } from "@/lib/billing/stripe-checkout";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import { requireOrganizationAdmin } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";
import type { BillingPlanKey } from "@/lib/billing/plans";

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

export async function startBillingCheckout(
  plan: BillingPlanKey,
  orgSlug?: string,
): Promise<void> {
  const { organization } = await requireOrganizationAdmin(orgSlug);
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

    redirect(session.url);
  }

  await recordBillingCheckoutAuditEvent({
    organizationId: organization.id,
    action: "billing.checkout.failed",
    outcome: getCheckoutAuditOutcome(session.reason),
    plan,
    status: session.reason,
    missingPriceEnvVar: session.missingPriceEnvVar,
  });

  redirectToSettings(orgSlug, session.reason);
}
