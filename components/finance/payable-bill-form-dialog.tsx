"use client";

import { WalletCards } from "lucide-react";

import { AppFormDialog } from "@/components/app/app-form-dialog";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import type { DbFamilyMember } from "@/lib/finance/server";

export function PayableBillFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormDialog
      title="Nova conta"
      description="Cadastre uma conta a pagar, vencimento, responsável e status."
      triggerLabel="Nova conta"
      icon={WalletCards}
    >
      <PayableBillForm members={members} />
    </AppFormDialog>
  );
}
