import { BankCreateSection } from "@/components/banks/bank-create-section";
import { BankHeroSummary } from "@/components/banks/bank-hero-summary";
import { BankList } from "@/components/banks/bank-list";
import { BankMemberBalances } from "@/components/banks/bank-member-balances";
import { BankPageHeader } from "@/components/banks/bank-page-header";
import { BankSummaryCards } from "@/components/banks/bank-summary-cards";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { getOrganizationBanksDashboardData } from "@/lib/organizations/banks";

export default async function BancosPage() {
  const [profile, bankData] = await Promise.all([
    getCurrentProfile(),
    getOrganizationBanksDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "BANCOS");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);
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

      <BankCreateSection canCreate={canCreate} members={members} />

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
