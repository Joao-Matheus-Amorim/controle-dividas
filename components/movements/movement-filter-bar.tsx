import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbFinancialMovement, FinancialMovementType } from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import { movementTypeLabelFromType } from "./movement-utils";

export type MovementFilters = {
  movementType: string;
  memberId: string;
  bankId: string;
  dateFrom: string;
  dateTo: string;
};

interface MovementFilterBarProps {
  filters: MovementFilters;
  movements: DbFinancialMovement[];
  hasActiveFilters: boolean;
  orgSlug?: string;
}

export function MovementFilterBar({
  filters,
  movements,
  hasActiveFilters,
  orgSlug,
}: MovementFilterBarProps) {
  const movementTypes = Array.from(
    new Set(movements.map((movement) => movement.movement_type)),
  ).sort((first, second) =>
    movementTypeLabelFromType(first).localeCompare(movementTypeLabelFromType(second)),
  );
  const members = Array.from(
    new Map(
      movements
        .filter((movement) => movement.family_members)
        .map((movement) => [
          movement.family_member_id,
          movement.family_members?.name ?? "Sem pessoa",
        ]),
    ).entries(),
  ).sort((first, second) => first[1].localeCompare(second[1]));
  const banks = Array.from(
    new Map(
      movements
        .filter((movement) => movement.banks)
        .map((movement) => [
          movement.bank_id,
          movement.banks?.bank_name ?? "Sem banco",
        ]),
    ).entries(),
  ).sort((first, second) => first[1].localeCompare(second[1]));

  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Filtros</p>
          <p className="mt-1 text-sm text-white/35">Refine por tipo, pessoa, banco e periodo.</p>
        </div>
        {hasActiveFilters ? (
          <Link
            href={getOrgPathFromProtectedPath("/protected/movimentacoes", orgSlug)}
            className="text-xs font-semibold text-[#8b72f8] underline-offset-4 hover:underline"
          >
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <form className="grid gap-3 md:grid-cols-5" method="get">
        <select
          name="tipo"
          defaultValue={filters.movementType}
          className="h-10 rounded-xl border border-white/10 bg-[#080810] px-3 text-sm text-white"
        >
          <option value="">Todos os tipos</option>
          {movementTypes.map((type) => (
            <option key={type} value={type}>
              {movementTypeLabelFromType(type as FinancialMovementType)}
            </option>
          ))}
        </select>

        <select
          name="pessoa"
          defaultValue={filters.memberId}
          className="h-10 rounded-xl border border-white/10 bg-[#080810] px-3 text-sm text-white"
        >
          <option value="">Todas as pessoas</option>
          {members.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        <select
          name="banco"
          defaultValue={filters.bankId}
          className="h-10 rounded-xl border border-white/10 bg-[#080810] px-3 text-sm text-white"
        >
          <option value="">Todos os bancos</option>
          {banks.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        <Input name="de" type="date" defaultValue={filters.dateFrom} className="h-10 rounded-xl" />
        <Input name="ate" type="date" defaultValue={filters.dateTo} className="h-10 rounded-xl" />

        <div className="md:col-span-5">
          <Button type="submit" variant="outline" className="h-10 rounded-xl border-white/10 bg-transparent text-white/70 hover:bg-white/10 hover:text-white">
            Aplicar filtros
          </Button>
        </div>
      </form>
    </section>
  );
}
