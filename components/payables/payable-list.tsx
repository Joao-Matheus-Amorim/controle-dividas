import Link from "next/link";
import { FileText, PlusCircle, SearchX } from "lucide-react";

import { AppEmptyState } from "@/components/app/app-empty-state";
import { Button } from "@/components/ui/button";
import type {
  DbBankAccount,
  DbExpenseCategory,
  DbFamilyMember,
  DbPayableBill,
} from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import { PayableFilterBar } from "./payable-filter-bar";
import { PayableListItem } from "./payable-list-item";
import type { StatusFilter, TypeFilter } from "./payable-utils";

type PayableListBill = DbPayableBill & { computed_status: string };

interface PayableListProps {
  bills: PayableListBill[];
  filteredBills: PayableListBill[];
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts: DbBankAccount[];
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  hasActiveFilters: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  orgSlug?: string;
}

export function PayableList({
  bills,
  filteredBills,
  members,
  categories,
  bankAccounts,
  statusFilter,
  typeFilter,
  hasActiveFilters,
  canEdit,
  canDelete,
  canCreate,
  orgSlug,
}: PayableListProps) {
  const clearFiltersHref = getOrgPathFromProtectedPath("/protected/contas-a-pagar", orgSlug);

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
          <Link href={clearFiltersHref} className="text-xs font-semibold text-[#8b72f8] underline-offset-4 hover:underline">
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <PayableFilterBar statusFilter={statusFilter} typeFilter={typeFilter} />

      {bills.length === 0 ? (
        <AppEmptyState
          icon={FileText}
          title="Nenhuma conta cadastrada"
          description="Crie uma conta avulsa ou fixa para acompanhar vencimentos, atrasos e pagamentos."
          action={
            canCreate ? (
              <Button asChild size="sm" className="h-10 w-full rounded-2xl bg-[#8b72f8] px-4 font-bold text-white hover:bg-[#7d66e4] sm:w-auto">
                <Link href="#nova-conta">
                  <PlusCircle className="h-4 w-4" />
                  Nova conta
                </Link>
              </Button>
            ) : null
          }
          className="items-start text-left"
        />
      ) : filteredBills.length === 0 ? (
        <AppEmptyState
          icon={SearchX}
          title="Nenhuma conta neste filtro"
          description="Volte para todos os status ou ajuste o tipo de conta para ver outros itens."
          action={
            <Button asChild size="sm" variant="outline" className="h-10 w-full rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/10 sm:w-auto">
              <Link href={clearFiltersHref}>Limpar filtros</Link>
            </Button>
          }
          className="items-start text-left"
        />
      ) : (
        filteredBills.map((bill) => (
          <PayableListItem
            key={bill.id}
            bill={bill}
            members={members}
            categories={categories}
            bankAccounts={bankAccounts}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))
      )}
    </section>
  );
}
