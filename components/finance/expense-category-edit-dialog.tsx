"use client";

import { Pencil } from "lucide-react";

import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { DbExpenseCategory } from "@/lib/finance/types";

export function ExpenseCategoryEditDialog({ category }: { category: DbExpenseCategory }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar categoria"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-3/4 md:max-w-md md:rounded-none md:border-l md:border-t-0 md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right">
        <SheetHeader>
          <SheetTitle>Editar categoria</SheetTitle>
          <SheetDescription>
            Atualize nome e descricao da categoria personalizada.
          </SheetDescription>
        </SheetHeader>
        <div className="pt-2">
          <ExpenseCategoryForm category={category} mode="edit" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
