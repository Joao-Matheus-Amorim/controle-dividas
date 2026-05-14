"use client";

import { Banknote } from "lucide-react";

import { AppFormDialog } from "@/components/app/app-form-dialog";
import { BankAccountForm } from "@/components/finance/bank-account-form";
import type { DbFamilyMember } from "@/lib/finance/server";

export function BankAccountFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormDialog
      title="Novo banco"
      description="Cadastre uma conta, banco, cartão ou saldo em dinheiro."
      triggerLabel="Novo banco"
      icon={Banknote}
    >
      <BankAccountForm members={members} />
    </AppFormDialog>
  );
}
