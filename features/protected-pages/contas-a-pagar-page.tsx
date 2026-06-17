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
import { getCurrentOrganizationProfile, getModulePermission } from "@/lib/finance/access-control";
import { getAccessibleMemberOptions } from "@/lib/finance/member-options";
import { getCurrentMonthLabel } from "@/lib/finance/period-context";
import { getOrganizationBankAccounts } from "@/lib/organizations/banks";
import { getOrganizationPayableBillsDashboardData } from "@/lib/organizations/payables";
import { requireOrganizationAccess } from "@/lib/organizations/server";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type ContasAPagarPageProps = {
  searchParams?: PageSearchParams;
  orgSlug?: string;
};

export async function ContasAPagarPage({ searchParams, orgSlug }: ContasAPagarPageProps) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(getSearchValue(params, "status"));
  const typeFilter = normalizeTypeFilter(getSearchValue(params, "tipo"));

  const [profile, payableData, organizationContext, bankAccounts] = await Promise.all([
    getCurrentOrganizationProfile(orgSlug),
    getOrganizationPayableBillsDashboardData(orgSlug),
    requireOrganizationAccess(orgSlug),
    getOrganizationBankAccounts(orgSlug),
  ]);
  const isOrganizationManager = ["owner", "admin"].includes(organizationContext.membership.role);
  const permission = isOrganizationManager || !profile?.is_active
    ? null
    : await getModulePermission(profile.id, "CONTAS_A_PAGAR", organizationContext.organization.id);
  const canCreate = isOrganizationManager || Boolean(permission?.can_create);
  const canEdit = isOrganizationManager || Boolean(permission?.can_edit);
  const canDelete = isOrganizationManager || Boolean(permission?.can_delete);
  const createMembers = canCreate
    ? await getAccessibleMemberOptions("CONTAS_A_PAGAR", "can_create", orgSlug)
    : [];
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
    <div className="app-container">
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

      <PayableCreateSection canCreate={canCreate} members={createMembers} orgSlug={orgSlug} />

      <PayableList
        bills={bills}
        filteredBills={filteredBills}
        members={members}
        bankAccounts={bankAccounts}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        hasActiveFilters={hasActiveFilters}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
