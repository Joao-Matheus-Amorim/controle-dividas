"use client";

import { useActionState } from "react";

import {
  updateReceivableIncomeStatusWithState,
  type ReceivableIncomeActionState,
} from "@/app/protected/contas-a-receber/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import type { DbReceivableIncome } from "@/lib/finance/types";

const initialState: ReceivableIncomeActionState = {};

export function ReceivableStatusForm({ income }: { income: DbReceivableIncome }) {
  const [state, formAction, isPending] = useActionState(
    updateReceivableIncomeStatusWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="hidden" name="id" value={income.id} />
        <select
          name="status"
          defaultValue={income.status}
          className="h-9 rounded-xl border border-white/10 bg-[#080810] px-2 text-xs text-white/70"
        >
          <option value="previsto">Previsto</option>
          <option value="recebido">Recebido</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
