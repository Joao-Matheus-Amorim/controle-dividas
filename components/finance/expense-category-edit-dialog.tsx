"use client";

import { Pencil } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Button } from "@/components/ui/button";
import type { DbExpenseCategory } from "@/lib/finance/types";

export function ExpenseCategoryEditDialog({ category }: { category: DbExpenseCategory }) {
  return (
    <AppFormSheet
      title="Editar categoria"
      description="Atualize nome e descricao da categoria personalizada."
      triggerLabel="Editar categoria"
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar categoria"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      }
    >
      <ExpenseCategoryForm category={category} mode="edit" />
    </AppFormSheet>
  );
}
