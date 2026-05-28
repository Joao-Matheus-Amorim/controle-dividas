"use server";

import { redirect } from "next/navigation";

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
    redirect(session.url);
  }

  redirectToSettings(orgSlug, session.reason);
}
