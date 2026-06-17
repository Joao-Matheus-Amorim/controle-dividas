"use client";

import { useActionState, useRef, useState } from "react";

import {
  updateReceivableIncomeStatusWithState,
  type ReceivableIncomeActionState,
} from "@/app/protected/contas-a-receber/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import type { DbBankAccount, DbReceivableIncome } from "@/lib/finance/types";

const initialState: ReceivableIncomeActionState = {};

type ReceivableIncomeWithComputedStatus = DbReceivableIncome & { computed_status?: string };

export function ReceivableStatusForm({
  income,
  bankAccounts,
}: {
  income: ReceivableIncomeWithComputedStatus;
  bankAccounts: DbBankAccount[];
}) {
  const [state, formAction, isPending] = useActionState(
    updateReceivableIncomeStatusWithState,
    initialState,
  );
  const effectiveStatus = income.computed_status ?? income.status;
  const [selectedStatus, setSelectedStatus] = useState(effectiveStatus);
  const recordedTimezoneRef = useRef<HTMLInputElement>(null);
  const memberBankAccounts = bankAccounts.filter(
    (account) => account.family_member_id === income.receiver_member_id,
  );
  const requiresBank = selectedStatus === "recebido";

  function captureRecordedTimezone() {
    if (recordedTimezoneRef.current) {
      recordedTimezoneRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }

  return (
    <form action={formAction} onSubmit={captureRecordedTimezone} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <input type="hidden" name="id" value={income.id} />
        <input ref={recordedTimezoneRef} type="hidden" name="recorded_timezone" defaultValue="" />
        <select
          name="status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="h-9 rounded-xl border border-white/10 bg-[#080810] px-2 text-xs text-white/70"
        >
          <option value="previsto">Previsto</option>
          <option value="recebido">Recebido</option>
          <option value="atrasado">Atrasado</option>
        </select>
        {requiresBank ? (
          <select
            name="bank_id"
            required
            className="h-9 min-w-[11rem] rounded-xl border border-white/10 bg-[#080810] px-2 text-xs text-white/70"
          >
            <option value="">Banco recebido</option>
            {memberBankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bank_name}
              </option>
            ))}
          </select>
        ) : null}
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
