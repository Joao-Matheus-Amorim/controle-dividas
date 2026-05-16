"use client";

import { useActionState } from "react";

import { updatePayableBillStatus, type PayableBillActionState } from "@/app/protected/contas-a-pagar/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import type { DbPayableBill } from "@/lib/finance/server";

const initialState: PayableBillActionState = {};

export function PayableBillStatusForm({ bill }: { bill: DbPayableBill }) {
  const [state, formAction, isPending] = useActionState(updatePayableBillStatus, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="hidden" name="id" value={bill.id} />
        <select name="status" defaultValue={bill.status} className="h-9 rounded-xl border border-white/10 bg-[#080810] px-2 text-xs text-white/70">
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <Button type="submit" variant="outline" disabled={isPending} className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
