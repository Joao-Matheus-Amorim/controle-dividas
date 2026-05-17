import { ReceivableCreateSection } from "@/components/receivables/receivable-create-section";
import { ReceivableHeroSummary } from "@/components/receivables/receivable-hero-summary";
import { ReceivableList } from "@/components/receivables/receivable-list";
import { ReceivablePageHeader } from "@/components/receivables/receivable-page-header";
import { ReceivableSummaryCards } from "@/components/receivables/receivable-summary-cards";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { getCurrentMonthLabel } from "@/lib/finance/period-context";
import { getOrganizationReceivableIncomesDashboardData } from "@/lib/organizations/receivables";

export default async function ContasAReceberPage() {
  const [profile, receivableData] = await Promise.all([
    getCurrentProfile(),
    getOrganizationReceivableIncomesDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "CONTAS_A_RECEBER");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
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

      <ReceivableCreateSection canCreate={canCreate} members={members} />

      <ReceivableList
        incomes={incomes}
        members={members}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
