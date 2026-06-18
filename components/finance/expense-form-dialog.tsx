"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ExpenseForm } from "@/components/finance/expense-form";
import type { DbBankAccount, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

export function ExpenseFormDialog({
  members,
  categories,
  bankAccounts,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts: DbBankAccount[];
  defaultMemberId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleSuccess() {
    setOpen(false);
    setFormKey((current) => current + 1);
  }

  return (
    <AppFormSheet
      open={open}
      onOpenChange={setOpen}
      title="Novo gasto"
      description="Cadastre um lançamento financeiro da família."
      triggerLabel="Novo gasto"
      icon={Plus}
    >
      <ExpenseForm
        key={formKey}
        members={members}
        categories={categories}
        bankAccounts={bankAccounts}
        defaultMemberId={defaultMemberId}
        onSuccess={handleSuccess}
      />
    </AppFormSheet>
  );
}
