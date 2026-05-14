import { Plus } from "lucide-react";

import { AppFormDialog } from "@/components/app/app-form-dialog";
import { ExpenseForm } from "@/components/finance/expense-form";
import type { DbExpenseCategory, DbFamilyMember } from "@/lib/finance/server";

export function ExpenseFormDialog({
  members,
  categories,
}: {
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
}) {
  return (
    <AppFormDialog
      title="Novo gasto"
      description="Cadastre um lançamento financeiro da família."
      triggerLabel="Novo gasto"
      icon={Plus}
    >
      <ExpenseForm members={members} categories={categories} />
    </AppFormDialog>
  );
}
