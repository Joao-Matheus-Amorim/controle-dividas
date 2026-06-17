"use client";

import { useActionState } from "react";

import {
  updateBankAccountBalanceWithState,
  type BankAccountActionState,
} from "@/app/protected/bancos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbBankAccount } from "@/lib/finance/types";

const initialState: BankAccountActionState = {};

export function BankBalanceForm({ account }: { account: DbBankAccount }) {
  const [state, formAction, isPending] = useActionState(
    updateBankAccountBalanceWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="hidden" name="id" value={account.id} />
        <Input
          aria-label="Saldo manual"
          name="current_balance"
          type="number"
          step="0.01"
          defaultValue={Number(account.current_balance)}
          className="h-9 w-28 rounded-xl border-white/10 bg-[#080810] text-xs text-white"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <p className="max-w-[220px] text-[11px] text-white/30">
        Ajuste manual do saldo atual.
      </p>
      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
