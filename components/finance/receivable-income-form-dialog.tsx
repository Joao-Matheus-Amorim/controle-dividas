"use client";

import { TrendingUp } from "lucide-react";

import { AppFormDialog } from "@/components/app/app-form-dialog";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import type { DbFamilyMember } from "@/lib/finance/server";

export function ReceivableIncomeFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormDialog
      title="Novo recebimento"
      description="Cadastre uma renda, entrada prevista ou recebimento da família."
      triggerLabel="Novo recebimento"
      icon={TrendingUp}
    >
      <ReceivableIncomeForm members={members} />
    </AppFormDialog>
  );
}
