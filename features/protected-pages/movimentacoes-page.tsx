import { MovementFilterBar, type MovementFilters } from "@/components/movements/movement-filter-bar";
import { MovementList } from "@/components/movements/movement-list";
import { MovementPageHeader } from "@/components/movements/movement-page-header";
import { MovementSummaryCards } from "@/components/movements/movement-summary-cards";
import { getOrganizationFinancialMovements } from "@/lib/organizations/financial-movements";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type MovimentacoesPageProps = {
  searchParams?: PageSearchParams;
  orgSlug?: string;
};

function getSearchValue(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function MovimentacoesPage({ searchParams, orgSlug }: MovimentacoesPageProps = {}) {
  const params = await searchParams;
  const filters: MovementFilters = {
    movementType: getSearchValue(params, "tipo") ?? "",
    memberId: getSearchValue(params, "pessoa") ?? "",
    bankId: getSearchValue(params, "banco") ?? "",
    dateFrom: getSearchValue(params, "de") ?? "",
    dateTo: getSearchValue(params, "ate") ?? "",
  };
  const movements = await getOrganizationFinancialMovements(orgSlug);
  const filteredMovements = movements.filter((movement) => {
    const movementDate = movement.occurred_at.slice(0, 10);
    const typeMatches = !filters.movementType || movement.movement_type === filters.movementType;
    const memberMatches = !filters.memberId || movement.family_member_id === filters.memberId;
    const bankMatches = !filters.bankId || movement.bank_id === filters.bankId;
    const fromMatches = !filters.dateFrom || movementDate >= filters.dateFrom;
    const toMatches = !filters.dateTo || movementDate <= filters.dateTo;

    return typeMatches && memberMatches && bankMatches && fromMatches && toMatches;
  });
  const totalInflow = filteredMovements
    .filter((movement) => movement.direction === "inflow")
    .reduce((total, movement) => total + Number(movement.amount), 0);
  const totalOutflow = filteredMovements
    .filter((movement) => movement.direction === "outflow")
    .reduce((total, movement) => total + Number(movement.amount), 0);
  const netTotal = totalInflow - totalOutflow;
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="app-container">
      <MovementPageHeader />

      <MovementSummaryCards
        totalInflow={totalInflow}
        totalOutflow={totalOutflow}
        netTotal={netTotal}
        movementCount={filteredMovements.length}
      />

      <MovementFilterBar
        filters={filters}
        movements={movements}
        hasActiveFilters={hasActiveFilters}
        orgSlug={orgSlug}
      />

      <MovementList movements={filteredMovements} />
    </div>
  );
}
