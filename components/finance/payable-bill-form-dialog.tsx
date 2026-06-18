"use client";

import { WalletCards } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import type { DbBankAccount, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

export function PayableBillFormDialog({
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
      title="Nova conta ou divida"
      description="Cadastre uma conta avulsa ou uma conta fixa mensal."
      triggerLabel="Nova conta/divida"
      icon={WalletCards}
    >
      <PayableBillForm
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
