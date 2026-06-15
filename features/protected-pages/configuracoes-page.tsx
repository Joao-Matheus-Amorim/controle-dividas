import { SettingsAutomaticRules } from "@/components/settings/settings-automatic-rules";
import { SettingsBillingPlanStatus } from "@/components/settings/settings-billing-plan-status";
import { SettingsCategories } from "@/components/settings/settings-categories";
import { SettingsHeroSummary } from "@/components/settings/settings-hero-summary";
import { SettingsMemberLimits } from "@/components/settings/settings-member-limits";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { SettingsSummaryCards } from "@/components/settings/settings-summary-cards";
import { getStripeConfigurationBoundary } from "@/lib/billing/stripe-config";
import { getOrganizationExpenseCategories } from "@/lib/organizations/categories";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { getOrganizationFamilyMembers } from "@/lib/organizations/people";

type ConfiguracoesPageProps = {
  orgSlug?: string;
  checkoutStatus?: string;
  portalStatus?: string;
};

export async function ConfiguracoesPage({
  orgSlug,
  checkoutStatus,
  portalStatus,
}: ConfiguracoesPageProps = {}) {
  const [members, categories, organization] = await Promise.all([
    getOrganizationFamilyMembers(orgSlug),
    getOrganizationExpenseCategories(orgSlug),
    requireOrganizationAccess(orgSlug),
  ]);
  const stripeBoundary = getStripeConfigurationBoundary();
  const canManageBilling = ["owner", "admin"].includes(organization.membership.role);
  const canManageCategories = ["owner", "admin"].includes(organization.membership.role);
  const canManagePeople = ["owner", "admin"].includes(organization.membership.role);

  const totalLimit = members.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  return (
    <div className="app-container">
      <SettingsPageHeader />

      <SettingsHeroSummary
        totalLimit={totalLimit}
        categoryCount={categories.length}
      />

      <SettingsSummaryCards
        totalLimit={totalLimit}
        categoryCount={categories.length}
      />

      {organization ? (
        <SettingsBillingPlanStatus
          organizationName={organization.organization.name}
          plan={organization.organization.plan}
          status={organization.organization.status}
          trialEndsAt={organization.organization.trial_ends_at}
          canManageBilling={canManageBilling}
          checkoutEnabled={stripeBoundary.checkoutEnabled}
          checkoutReady={stripeBoundary.ready}
          checkoutStatus={checkoutStatus}
          portalStatus={portalStatus}
          hasStripeCustomer={Boolean(organization.organization.stripe_customer_id)}
          orgSlug={orgSlug}
        />
      ) : null}

      <SettingsMemberLimits members={members} canManagePeople={canManagePeople} />

      <SettingsCategories categories={categories} canManageCategories={canManageCategories} />

      <SettingsAutomaticRules />
    </div>
  );
}
