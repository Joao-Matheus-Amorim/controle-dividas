import { SettingsAutomaticRules } from "@/components/settings/settings-automatic-rules";
import { SettingsBillingPlanStatus } from "@/components/settings/settings-billing-plan-status";
import { SettingsCategories } from "@/components/settings/settings-categories";
import { SettingsHeroSummary } from "@/components/settings/settings-hero-summary";
import { SettingsMemberLimits } from "@/components/settings/settings-member-limits";
import { SettingsOrganizationCurrency } from "@/components/settings/settings-organization-currency";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { SettingsReceivableIncomeSources } from "@/components/settings/settings-receivable-income-sources";
import { SettingsSummaryCards } from "@/components/settings/settings-summary-cards";
import {
  getSettingsCurrencies,
  getSettingsCurrencyHelper,
  getSettingsCurrencyLabel,
  getSettingsTotalLimitHelper,
  getSettingsTotalLimitLabel,
} from "@/components/settings/settings-utils";
import { getStripeConfigurationBoundary } from "@/lib/billing/stripe-config";
import { getOrganizationExpenseCategories } from "@/lib/organizations/categories";
import { getOrganizationReceivableIncomeSources } from "@/lib/organizations/receivable-income-sources";
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
  const [members, categories, receivableIncomeSources, organization] = await Promise.all([
    getOrganizationFamilyMembers(orgSlug),
    getOrganizationExpenseCategories(orgSlug),
    getOrganizationReceivableIncomeSources(orgSlug),
    requireOrganizationAccess(orgSlug),
  ]);
  const stripeBoundary = getStripeConfigurationBoundary();
  const canManageBilling = ["owner", "admin"].includes(organization.membership.role);
  const canManageCategories = ["owner", "admin"].includes(organization.membership.role);
  const canManagePeople = ["owner", "admin"].includes(organization.membership.role);
  const canManageCurrency = ["owner", "admin"].includes(organization.membership.role);
  const currencies = getSettingsCurrencies(members);
  const totalLimitLabel = getSettingsTotalLimitLabel(members);
  const totalLimitHelper = getSettingsTotalLimitHelper(members);
  const currencyLabel = getSettingsCurrencyLabel(currencies);
  const currencyHelper = getSettingsCurrencyHelper(currencies);

  return (
    <div className="app-container">
      <SettingsPageHeader />

      <SettingsHeroSummary
        totalLimitLabel={totalLimitLabel}
        totalLimitHelper={totalLimitHelper}
        categoryCount={categories.length}
        currencyLabel={currencyLabel}
      />

      <SettingsSummaryCards
        totalLimitLabel={totalLimitLabel}
        totalLimitHelper={totalLimitHelper}
        categoryCount={categories.length}
        currencyLabel={currencyLabel}
        currencyHelper={currencyHelper}
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

      <SettingsOrganizationCurrency
        currentCurrency={organization.organization.display_currency}
        canManageCurrency={canManageCurrency}
      />

      <SettingsMemberLimits members={members} canManagePeople={canManagePeople} />

      <SettingsCategories categories={categories} canManageCategories={canManageCategories} />

      <SettingsReceivableIncomeSources
        sources={receivableIncomeSources}
        canManageSources={canManageCategories}
      />

      <SettingsAutomaticRules />
    </div>
  );
}
