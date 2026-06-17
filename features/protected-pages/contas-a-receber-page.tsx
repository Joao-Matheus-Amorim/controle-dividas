import { ReceivableCreateSection } from "@/components/receivables/receivable-create-section";
import { ReceivableHeroSummary } from "@/components/receivables/receivable-hero-summary";
import { ReceivableList } from "@/components/receivables/receivable-list";
import { ReceivablePageHeader } from "@/components/receivables/receivable-page-header";
import { ReceivableSummaryCards } from "@/components/receivables/receivable-summary-cards";
import { getCurrentOrganizationProfile, getModulePermission } from "@/lib/finance/access-control";
import { getAccessibleMemberOptions } from "@/lib/finance/member-options";
import { getCurrentMonthLabel } from "@/lib/finance/period-context";
import { getOrganizationBankAccountsForMembers } from "@/lib/organizations/banks";
import { getOrganizationReceivableIncomesDashboardData } from "@/lib/organizations/receivables";
import { requireOrganizationAccess } from "@/lib/organizations/server";

type ContasAReceberPageProps = {
  orgSlug?: string;
};

export async function ContasAReceberPage({ orgSlug }: ContasAReceberPageProps = {}) {
  const [profile, receivableData, organizationContext] = await Promise.all([
    getCurrentOrganizationProfile(orgSlug),
    getOrganizationReceivableIncomesDashboardData(orgSlug),
    requireOrganizationAccess(orgSlug),
  ]);
  const isOrganizationManager = ["owner", "admin"].includes(organizationContext.membership.role);
  const permission = isOrganizationManager || !profile?.is_active
    ? null
    : await getModulePermission(profile.id, "CONTAS_A_RECEBER", organizationContext.organization.id);
  const canCreate = isOrganizationManager || Boolean(permission?.can_create);
  const canEdit = isOrganizationManager || Boolean(permission?.can_edit);
  const canDelete = isOrganizationManager || Boolean(permission?.can_delete);
  const createMembers = canCreate
    ? await getAccessibleMemberOptions("CONTAS_A_RECEBER", "can_create", orgSlug)
    : [];
  const bankAccounts = canEdit
    ? await getOrganizationBankAccountsForMembers(receivableData.members, orgSlug)
    : [];
  const periodLabel = getCurrentMonthLabel();

  const {
    members,
    incomes,
    totalExpected,
    totalOverdue,
    totalReceived,
    totalFixed,
    totalVariable,
    overdueCount,
    receivedCount,
  } = receivableData;

  return (
    <div className="app-container">
      <ReceivablePageHeader periodLabel={periodLabel} />

      <ReceivableHeroSummary
        totalExpected={totalExpected}
        totalOverdue={totalOverdue}
        totalReceived={totalReceived}
        receivedCount={receivedCount}
        overdueCount={overdueCount}
      />

      <ReceivableSummaryCards
        totalExpected={totalExpected}
        totalReceived={totalReceived}
        totalOverdue={totalOverdue}
        totalFixed={totalFixed}
        totalVariable={totalVariable}
      />

      <ReceivableCreateSection canCreate={canCreate} members={createMembers} orgSlug={orgSlug} />

      <ReceivableList
        incomes={incomes}
        members={members}
        bankAccounts={bankAccounts}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
      />
    </div>
  );
}
