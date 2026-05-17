import { PayableCreateSection } from "@/components/payables/payable-create-section";
import { PayableHeroSummary } from "@/components/payables/payable-hero-summary";
import { PayableList } from "@/components/payables/payable-list";
import { PayablePageHeader } from "@/components/payables/payable-page-header";
import { PayableSummaryCards } from "@/components/payables/payable-summary-cards";
import {
  getSearchValue,
  normalizeStatusFilter,
  normalizeTypeFilter,
} from "@/components/payables/payable-utils";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { getCurrentMonthLabel } from "@/lib/finance/period-context";
import { getOrganizationPayableBillsDashboardData } from "@/lib/organizations/payables";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type ContasAPagarPageProps = {
  searchParams?: PageSearchParams;
};

export default async function ContasAPagarPage({ searchParams }: ContasAPagarPageProps) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(getSearchValue(params, "status"));
  const typeFilter = normalizeTypeFilter(getSearchValue(params, "tipo"));

  const [profile, payableData] = await Promise.all([
    getCurrentProfile(),
    getOrganizationPayableBillsDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "CONTAS_A_PAGAR");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);
  const periodLabel = getCurrentMonthLabel();

  const {
    members,
    bills,
    totalPending,
    totalOverdue,
    totalPaid,
    totalOneOff,
    totalFixed,
    pendingCount,
    overdueCount,
    oneOffCount,
    fixedCount,
  } = payableData;

  const filteredBills = bills.filter((bill) => {
    const statusMatches = statusFilter === "todos" || bill.computed_status === statusFilter;
    const typeMatches = typeFilter === "todas" || bill.bill_type === typeFilter;

    return statusMatches && typeMatches;
  });
  const hasActiveFilters = statusFilter !== "todos" || typeFilter !== "todas";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <PayablePageHeader periodLabel={periodLabel} />

      <PayableHeroSummary
        totalPending={totalPending}
        totalOverdue={totalOverdue}
        pendingCount={pendingCount}
        overdueCount={overdueCount}
      />

      <PayableSummaryCards
        totalPending={totalPending}
        totalOverdue={totalOverdue}
        totalPaid={totalPaid}
        totalOneOff={totalOneOff}
        totalFixed={totalFixed}
        oneOffCount={oneOffCount}
        fixedCount={fixedCount}
      />

      <PayableCreateSection canCreate={canCreate} members={members} />

      <PayableList
        bills={bills}
        filteredBills={filteredBills}
        members={members}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        hasActiveFilters={hasActiveFilters}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
