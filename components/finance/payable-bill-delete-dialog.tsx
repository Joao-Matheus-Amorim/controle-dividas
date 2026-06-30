"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import { deletePayableBill, type PayableBillActionState } from "@/app/protected/contas-a-pagar/actions";
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
import type { DbPayableBill } from "@/lib/finance/types";

const initialState: PayableBillActionState = {};

export function PayableBillDeleteDialog({ bill }: { bill: DbPayableBill }) {
  const [state, formAction, isPending] = useActionState(deletePayableBill, initialState);
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
          aria-label="Excluir conta"
          className="h-9 w-9 rounded-xl border-border bg-transparent text-ff-subtle-foreground hover:bg-ff-bg-soft hover:text-foreground"
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

          <div className="rounded-2xl border border-ff-destructive bg-ff-destructive-soft p-4 text-sm text-ff-destructive">
            Tem certeza que deseja excluir <strong className="text-foreground">{bill.name}</strong>?
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background/50 p-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>Confirmo que quero excluir esta conta/divida.</span>
          </label>

          <AppActionFeedback error={state.error} success={state.success} />

          <Button
            type="submit"
            disabled={!isConfirmed || isPending}
            className="w-full rounded-2xl bg-ff-destructive font-bold text-foreground hover:bg-ff-destructive/90"
          >
            {isPending ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
