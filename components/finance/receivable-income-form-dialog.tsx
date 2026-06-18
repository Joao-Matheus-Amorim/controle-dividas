"use client";

import { TrendingUp } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import type {
  DbBankAccount,
  DbFamilyMember,
  DbReceivableIncomeSource,
} from "@/lib/finance/types";

export function ReceivableIncomeFormDialog({
  members,
  sources,
  bankAccounts,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
  sources: DbReceivableIncomeSource[];
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
      title="Nova entrada"
      description="Cadastre salário, comissão, renda fixa ou recebimento pontual com pessoa, valor e data previstos."
      triggerLabel="Nova entrada"
      icon={TrendingUp}
    >
      <ReceivableIncomeForm
        key={formKey}
        members={members}
        sources={sources}
        bankAccounts={bankAccounts}
        defaultMemberId={defaultMemberId}
        onSuccess={handleSuccess}
      />
    </AppFormSheet>
  );
}
