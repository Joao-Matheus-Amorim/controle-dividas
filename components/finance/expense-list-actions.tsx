"use client";

import { ExpenseDeleteDialog } from "@/components/finance/expense-delete-dialog";
import { ExpenseEditDialog } from "@/components/finance/expense-edit-dialog";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/server";

export function ExpenseListActions({
  expense,
  members,
  categories,
  canEdit,
  canDelete,
}: {
  expense: DbExpense;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {canEdit ? <ExpenseEditDialog expense={expense} members={members} categories={categories} /> : null}
      {canDelete ? <ExpenseDeleteDialog expense={expense} /> : null}
    </div>
  );
}
