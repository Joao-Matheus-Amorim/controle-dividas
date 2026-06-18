"use client";

import { Banknote } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { BankAccountForm } from "@/components/finance/bank-account-form";
import type { DbFamilyMember } from "@/lib/finance/types";

export function BankAccountFormDialog({
  members,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
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
      title="Novo banco"
      description="Cadastre uma conta, banco, cartão ou saldo em dinheiro."
      triggerLabel="Novo banco"
      icon={Banknote}
    >
      <BankAccountForm
        key={formKey}
        members={members}
        defaultMemberId={defaultMemberId}
        onSuccess={handleSuccess}
      />
    </AppFormSheet>
  );
}
