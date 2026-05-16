"use client";

import { WalletCards } from "lucide-react";

import { AppFormDialog } from "@/components/app/app-form-dialog";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import type { DbFamilyMember } from "@/lib/finance/server";

export function PayableBillFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormDialog
      title="Nova conta ou divida"
      description="Cadastre uma conta avulsa ou uma conta fixa mensal."
      triggerLabel="Nova conta/divida"
      icon={WalletCards}
    >
      <PayableBillForm members={members} />
    </AppFormDialog>
  );
}
