"use client";

import { useActionState } from "react";

import {
  deleteBankAccountWithState,
  type BankAccountActionState,
} from "@/app/protected/bancos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const initialState: BankAccountActionState = {};

export function BankDeleteForm({ accountId }: { accountId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteBankAccountWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="id" value={accountId} />
      <Button
        type="submit"
        variant="outline"
        size="icon"
        disabled={isPending}
        aria-label="Excluir banco"
        className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
