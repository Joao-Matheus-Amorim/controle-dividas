"use client";

import { WalletCards } from "lucide-react";

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
  return (
    <AppFormSheet
      title="Nova conta ou divida"
      description="Cadastre uma conta avulsa ou uma conta fixa mensal."
      triggerLabel="Nova conta/divida"
      icon={WalletCards}
    >
      <PayableBillForm
        members={members}
        categories={categories}
        bankAccounts={bankAccounts}
        defaultMemberId={defaultMemberId}
      />
    </AppFormSheet>
  );
}
