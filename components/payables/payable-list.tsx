import Link from "next/link";

import type { DbFamilyMember, DbPayableBill } from "@/lib/finance/types";
import { PayableFilterBar } from "./payable-filter-bar";
import { PayableListItem } from "./payable-list-item";
import type { StatusFilter, TypeFilter } from "./payable-utils";

type PayableListBill = DbPayableBill & { computed_status: string };

interface PayableListProps {
  bills: PayableListBill[];
  filteredBills: PayableListBill[];
  members: DbFamilyMember[];
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  hasActiveFilters: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function PayableList({
  bills,
  filteredBills,
  members,
  statusFilter,
  typeFilter,
  hasActiveFilters,
  canEdit,
  canDelete,
}: PayableListProps) {
  return (
    <section className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Contas e dividas cadastradas</p>
          <p className="mt-1 text-sm text-white/35">
            {filteredBills.length} de {bills.length} itens visiveis no seu escopo.
          </p>
        </div>
        {hasActiveFilters ? (
          <Link href="/protected/contas-a-pagar" className="text-xs font-semibold text-[#8b72f8] underline-offset-4 hover:underline">
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <PayableFilterBar statusFilter={statusFilter} typeFilter={typeFilter} />

      {bills.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">
          Nenhuma conta ou divida cadastrada ainda. Crie uma conta avulsa ou fixa para acompanhar vencimentos.
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">
          Nenhuma conta encontrada com os filtros selecionados.
        </div>
      ) : (
        filteredBills.map((bill) => (
          <PayableListItem
            key={bill.id}
            bill={bill}
            members={members}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))
      )}
    </section>
  );
}
