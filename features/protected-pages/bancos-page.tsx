import { BankCreateSection } from "@/components/banks/bank-create-section";
import { BankHeroSummary } from "@/components/banks/bank-hero-summary";
import { BankList } from "@/components/banks/bank-list";
import { BankMemberBalances } from "@/components/banks/bank-member-balances";
import { BankPageHeader } from "@/components/banks/bank-page-header";
import { BankSummaryCards } from "@/components/banks/bank-summary-cards";
import { getCurrentOrganizationProfile, getModulePermission } from "@/lib/finance/access-control";
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
  const { members, accounts, accountsByMember, totalBalance, totalAccounts } = bankData;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <BankPageHeader />

      <BankHeroSummary
        totalBalance={totalBalance}
        totalAccounts={totalAccounts}
        memberCount={members.length}
      />

      <BankSummaryCards
        totalBalance={totalBalance}
        totalAccounts={totalAccounts}
        memberCount={members.length}
      />

      <BankCreateSection canCreate={canCreate} members={members} orgSlug={orgSlug} />

      <BankMemberBalances members={accountsByMember} />

      <BankList
        accounts={accounts}
        members={members}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
