"use client";

import { WalletCards } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import type { DbFamilyMember } from "@/lib/finance/server";

export function PayableBillFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormSheet
      title="Nova conta ou divida"
      description="Cadastre uma conta avulsa ou uma conta fixa mensal."
      triggerLabel="Nova conta/divida"
      icon={WalletCards}
    >
      <PayableBillForm members={members} />
    </AppFormSheet>
  );
}