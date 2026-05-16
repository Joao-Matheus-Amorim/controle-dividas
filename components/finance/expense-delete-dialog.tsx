"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteExpense } from "@/app/protected/gastos/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbExpense } from "@/lib/finance/server";

export function ExpenseDeleteDialog({ expense }: { expense: DbExpense }) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Excluir gasto"
          className="h-8 w-8 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir gasto</DialogTitle>
          <DialogDescription>
            Esta acao remove o gasto da listagem e atualiza os totais.
          </DialogDescription>
        </DialogHeader>

        <form action={deleteExpense} className="space-y-4 pt-2">
          <input type="hidden" name="id" value={expense.id} />
          <input type="hidden" name="confirm_delete" value={isConfirmed ? "confirmado" : ""} />

          <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 p-4 text-sm text-[#ff8da0]">
            Confirme a exclusao de <strong className="text-white">{expense.description}</strong>.
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>Confirmo que quero excluir este gasto.</span>
          </label>

          <Button
            type="submit"
            disabled={!isConfirmed}
            className="w-full rounded-2xl bg-[#f0506e] font-bold text-white hover:bg-[#df405f]"
          >
            Excluir gasto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
