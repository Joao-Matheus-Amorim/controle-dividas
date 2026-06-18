"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  deleteBankAccountWithState,
  type BankAccountActionState,
} from "@/app/protected/bancos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbBankAccount } from "@/lib/finance/types";

const initialState: BankAccountActionState = {};

export function BankDeleteForm({ account }: { account: DbBankAccount }) {
  const [state, formAction, isPending] = useActionState(
    deleteBankAccountWithState,
    initialState,
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      setIsConfirmed(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Excluir banco"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir banco</DialogTitle>
          <DialogDescription>
            Esta acao remove o banco da listagem. Bancos com movimentacoes precisam de estorno ou migracao antes da exclusao.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          <input type="hidden" name="id" value={account.id} />
          <input type="hidden" name="confirm_delete" value={isConfirmed ? "confirmado" : ""} />

          <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 p-4 text-sm text-[#ff8da0]">
            Confirme a exclusao de <strong className="text-white">{account.bank_name}</strong>.
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>Confirmo que quero excluir este banco.</span>
          </label>

          <AppActionFeedback error={state.error} success={state.success} />

          <Button
            type="submit"
            disabled={!isConfirmed || isPending}
            className="w-full rounded-2xl bg-[#f0506e] font-bold text-white hover:bg-[#df405f]"
          >
            {isPending ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
