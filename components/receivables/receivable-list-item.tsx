import { deleteReceivableIncome, updateReceivableIncomeStatus } from "@/app/protected/contas-a-receber/actions";
import { ReceivableIncomeEditDialog } from "@/components/finance/receivable-income-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";
import { Trash2 } from "lucide-react";
import { compactCurrency, statusVariant } from "./receivable-utils";

type ReceivableListIncome = DbReceivableIncome & { computed_status: string };

interface ReceivableListItemProps {
  income: ReceivableListIncome;
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
}

export function ReceivableListItem({ income, members, canEdit, canDelete }: ReceivableListItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{income.source}</p>
          <Badge variant={statusVariant(income.computed_status)}>{income.computed_status}</Badge>
          <Badge variant="outline" className="border-white/10 text-white/50">renda {income.income_type}</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-white/35">{income.family_members?.name || "Sem pessoa vinculada"}</p>
        <p className="mt-0.5 truncate text-xs text-white/25">Data prevista: {new Date(`${income.expected_date}T00:00:00`).toLocaleDateString("pt-BR")}{income.receiving_bank ? ` · ${income.receiving_bank}` : ""}</p>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <p className="text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
        {canEdit ? (
          <>
            <ReceivableIncomeEditDialog income={income} members={members} />
            <form action={updateReceivableIncomeStatus} className="flex gap-2">
              <input type="hidden" name="id" value={income.id} />
              <select name="status" defaultValue={income.status} className="h-9 rounded-xl border border-white/10 bg-[#080810] px-2 text-xs text-white/70">
                <option value="previsto">Previsto</option>
                <option value="recebido">Recebido</option>
                <option value="atrasado">Atrasado</option>
              </select>
              <Button type="submit" variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">Salvar</Button>
            </form>
          </>
        ) : null}
        {canDelete ? (
          <form action={deleteReceivableIncome}>
            <input type="hidden" name="id" value={income.id} />
            <Button type="submit" variant="outline" size="icon" aria-label="Excluir recebimento" className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
