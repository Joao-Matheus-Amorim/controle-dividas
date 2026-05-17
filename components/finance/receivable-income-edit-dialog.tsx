"use client";

import { Pencil } from "lucide-react";

import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";

export function ReceivableIncomeEditDialog({
  income,
  members,
}: {
  income: DbReceivableIncome;
  members: DbFamilyMember[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar recebimento"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar recebimento</DialogTitle>
          <DialogDescription>
            Atualize pessoa, origem, valor, data, status, banco e observacoes.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <ReceivableIncomeForm members={members} income={income} mode="edit" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
