import Link from "next/link";
import { PlusCircle, TrendingUp } from "lucide-react";

import { AppEmptyState } from "@/components/app/app-empty-state";
import { Button } from "@/components/ui/button";
import type {
  DbBankAccount,
  DbFamilyMember,
  DbReceivableIncome,
  DbReceivableIncomeSource,
} from "@/lib/finance/types";
import { ReceivableListItem } from "./receivable-list-item";

type ReceivableListIncome = DbReceivableIncome & { computed_status: string };

interface ReceivableListProps {
  incomes: ReceivableListIncome[];
  members: DbFamilyMember[];
  sources: DbReceivableIncomeSource[];
  bankAccounts: DbBankAccount[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

export function ReceivableList({
  incomes,
  members,
  sources,
  bankAccounts,
  canEdit,
  canDelete,
  canCreate,
}: ReceivableListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Recebimentos</p>
        <p className="text-xs font-semibold text-[#8b72f8]">{incomes.length}</p>
      </div>

      {incomes.length === 0 ? (
        <AppEmptyState
          icon={TrendingUp}
          title="Nenhum recebimento previsto"
          description="Cadastre uma entrada para acompanhar valores esperados, atrasados e recebidos."
          action={
            canCreate ? (
              <Button asChild size="sm" className="h-10 w-full rounded-2xl bg-[#8b72f8] px-4 font-bold text-white hover:bg-[#7d66e4] sm:w-auto">
                <Link href="#novo-recebimento">
                  <PlusCircle className="h-4 w-4" />
                  Novo recebimento
                </Link>
              </Button>
            ) : null
          }
          className="items-start text-left"
        />
      ) : (
        incomes.map((income) => (
          <ReceivableListItem
            key={income.id}
            income={income}
            members={members}
            sources={sources}
            bankAccounts={bankAccounts}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))
      )}
    </section>
  );
}
