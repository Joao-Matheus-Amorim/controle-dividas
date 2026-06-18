"use client";

import { TrendingUp } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";

export function ReceivableIncomeFormDialog({
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
      title="Nova entrada"
      description="Cadastre salário, comissão, renda fixa ou recebimento pontual com pessoa, valor e data previstos."
      triggerLabel="Nova entrada"
      icon={TrendingUp}
    >
      <ReceivableIncomeForm members={members} bankAccounts={bankAccounts} defaultMemberId={defaultMemberId} />
    </AppFormSheet>
  );
}
