"use client";

import { Pencil } from "lucide-react";

import { ExpenseForm } from "@/components/finance/expense-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/server";

export function ExpenseEditDialog({
  expense,
  members,
  categories,
}: {
  expense: DbExpense;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar gasto"
          className="h-8 w-8 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar gasto</DialogTitle>
          <DialogDescription>
            Atualize pessoa, categoria, valor, data, local, pagamento e observacoes.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <ExpenseForm members={members} categories={categories} expense={expense} mode="edit" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
