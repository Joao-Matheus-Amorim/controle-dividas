import { MovementList } from "@/components/movements/movement-list";
import { MovementPageHeader } from "@/components/movements/movement-page-header";
import { MovementSummaryCards } from "@/components/movements/movement-summary-cards";
import { getOrganizationFinancialMovements } from "@/lib/organizations/financial-movements";

type MovimentacoesPageProps = {
  orgSlug?: string;
};

export async function MovimentacoesPage({ orgSlug }: MovimentacoesPageProps = {}) {
  const movements = await getOrganizationFinancialMovements(orgSlug);
  const totalInflow = movements
    .filter((movement) => movement.direction === "inflow")
    .reduce((total, movement) => total + Number(movement.amount), 0);
  const totalOutflow = movements
    .filter((movement) => movement.direction === "outflow")
    .reduce((total, movement) => total + Number(movement.amount), 0);
  const netTotal = totalInflow - totalOutflow;

  return (
    <div className="app-container">
      <MovementPageHeader />

      <MovementSummaryCards
        totalInflow={totalInflow}
        totalOutflow={totalOutflow}
        netTotal={netTotal}
        movementCount={movements.length}
      />

      <MovementList movements={movements} />
    </div>
  );
}
