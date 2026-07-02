import { BankCreateSection } from "@/components/banks/bank-create-section";
import { BankHeroSummary } from "@/components/banks/bank-hero-summary";
import { BankList } from "@/components/banks/bank-list";
import { BankPageHeader } from "@/components/banks/bank-page-header";
import { BankSummaryCards } from "@/components/banks/bank-summary-cards";
import { getCurrentOrganizationProfile, getModulePermission } from "@/lib/finance/access-control";
import { formatAmountsInCurrency } from "@/lib/finance/currency-summary";
import { getAccessibleMemberOptions } from "@/lib/finance/member-options";
import { getOrganizationBanksDashboardData } from "@/lib/organizations/banks";
import { requireOrganizationAccess } from "@/lib/organizations/server";

type BancosPageProps = {
  orgSlug?: string;
};

export async function BancosPage({ orgSlug }: BancosPageProps = {}) {
  const [profile, bankData, organizationContext] = await Promise.all([
    getCurrentOrganizationProfile(orgSlug),
    getOrganizationBanksDashboardData(orgSlug),
    requireOrganizationAccess(orgSlug),
  ]);
  const isOrganizationManager = ["owner", "admin"].includes(organizationContext.membership.role);
  const permission = isOrganizationManager || !profile?.is_active
    ? null
    : await getModulePermission(profile.id, "BANCOS", organizationContext.organization.id);
  const canCreate = isOrganizationManager || Boolean(permission?.can_create);
  const canEdit = isOrganizationManager || Boolean(permission?.can_edit);
  const canDelete = isOrganizationManager || Boolean(permission?.can_delete);
  const createMembers = canCreate
    ? await getAccessibleMemberOptions("BANCOS", "can_create", orgSlug)
    : [];
  const { members, accounts, totalAccounts } = bankData;
  const displayCurrency = organizationContext.organization.display_currency;
  const totalBalanceLabel = await formatAmountsInCurrency(
    accounts.map((account) => ({
      amount: Number(account.current_balance),
      currency: account.currency,
    })),
    displayCurrency,
  );

  return (
    <div className="app-container">
      <BankPageHeader />

      <BankHeroSummary
        totalBalanceLabel={totalBalanceLabel}
        totalAccounts={totalAccounts}
        memberCount={members.length}
      />

      <BankSummaryCards
        totalBalanceLabel={totalBalanceLabel}
        totalAccounts={totalAccounts}
        memberCount={members.length}
      />

      <BankCreateSection canCreate={canCreate} members={createMembers} orgSlug={orgSlug} />

      <BankList
        accounts={accounts}
        members={members}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
      />
    </div>
  );
}
