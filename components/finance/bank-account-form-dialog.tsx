"use client";

import { Banknote } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { BankAccountForm } from "@/components/finance/bank-account-form";
import type { DbFamilyMember } from "@/lib/finance/types";

export function BankAccountFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormSheet
      title="Novo banco"
      description="Cadastre uma conta, banco, cartão ou saldo em dinheiro."
      triggerLabel="Novo banco"
      icon={Banknote}
    >
      <BankAccountForm members={members} />
    </AppFormSheet>
  );
}
