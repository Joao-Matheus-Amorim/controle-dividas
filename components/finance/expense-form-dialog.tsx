"use client";

import { Plus } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ExpenseForm } from "@/components/finance/expense-form";
import type { DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

export function ExpenseFormDialog({
  members,
  categories,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  defaultMemberId?: string;
}) {
  return (
    <AppFormSheet
      title="Novo gasto"
      description="Cadastre um lançamento financeiro da família."
      triggerLabel="Novo gasto"
      icon={Plus}
    >
      <ExpenseForm
        members={members}
        categories={categories}
        defaultMemberId={defaultMemberId}
      />
    </AppFormSheet>
  );
}
