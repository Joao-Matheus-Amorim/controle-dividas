"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import { deletePayableBill, type PayableBillActionState } from "@/app/protected/contas-a-pagar/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbPayableBill } from "@/lib/finance/server";

const initialState: PayableBillActionState = {};

export function PayableBillDeleteDialog({ bill }: { bill: DbPayableBill }) {
  const [state, formAction, isPending] = useActionState(deletePayableBill, initialState);
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Excluir conta"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta ou divida</DialogTitle>
          <DialogDescription>
            Esta acao remove a conta da sua listagem e atualiza o dashboard. Ela nao deve ser usada para marcar uma conta como paga.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          <input type="hidden" name="id" value={bill.id} />
          <input type="hidden" name="confirm_delete" value={isConfirmed ? "confirmado" : ""} />

          <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 p-4 text-sm text-[#ff8da0]">
            Tem certeza que deseja excluir <strong className="text-white">{bill.name}</strong>?
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>Confirmo que quero excluir esta conta/divida.</span>
          </label>

          {state.error ? <p className="text-sm text-[#ff8da0]">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-[#1de9b2]">{state.success}</p> : null}

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
