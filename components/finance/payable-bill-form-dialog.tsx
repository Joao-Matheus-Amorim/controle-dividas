"use client";

import { WalletCards } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";

export function PayableBillFormDialog({
  members,
  bankAccounts,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
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
      <PayableBillForm members={members} bankAccounts={bankAccounts} defaultMemberId={defaultMemberId} />
    </AppFormSheet>
  );
}
