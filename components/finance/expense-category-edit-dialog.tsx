"use client";

import { Pencil } from "lucide-react";

import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbExpenseCategory } from "@/lib/finance/server";

export function ExpenseCategoryEditDialog({ category }: { category: DbExpenseCategory }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar categoria"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar categoria</DialogTitle>
          <DialogDescription>
            Atualize nome e descricao da categoria personalizada.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <ExpenseCategoryForm category={category} mode="edit" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
