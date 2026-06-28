import type { BillingPlanKey } from "@/lib/billing/plans";

export type OrganizationRole = "owner" | "admin" | "adult" | "child" | "custom" | "member";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  owner_auth_user_id: string;
  display_currency: string;
  plan: BillingPlanKey;
  status: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  auth_user_id: string;
  role: OrganizationRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationContext {
  organization: Organization;
  membership: OrganizationMembership;
}
