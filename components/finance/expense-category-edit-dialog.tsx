"use client";

import { Pencil } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Button } from "@/components/ui/button";
import type { DbExpenseCategory } from "@/lib/finance/types";

export function ExpenseCategoryEditDialog({
  category,
  categories,
}: {
  category: DbExpenseCategory;
  categories: DbExpenseCategory[];
}) {
  return (
    <AppFormSheet
      title="Editar categoria"
      description="Atualize nome, descricao e categoria principal."
      triggerLabel="Editar categoria"
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar categoria"
          className="h-9 w-9 rounded-xl border-border bg-transparent text-ff-subtle-foreground hover:bg-ff-bg-soft hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      }
    >
      <ExpenseCategoryForm
        category={category}
        categories={categories}
        mode="edit"
        submitLayout="sheet"
      />
    </AppFormSheet>
  );
}
