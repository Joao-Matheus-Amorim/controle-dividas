"use client";

import { TrendingUp } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import type { DbFamilyMember } from "@/lib/finance/types";

export function ReceivableIncomeFormDialog({
  members,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
  defaultMemberId?: string;
}) {
  return (
    <AppFormSheet
      title="Novo recebimento"
      description="Cadastre uma renda, entrada prevista ou recebimento da família."
      triggerLabel="Novo recebimento"
      icon={TrendingUp}
    >
      <ReceivableIncomeForm members={members} defaultMemberId={defaultMemberId} />
    </AppFormSheet>
  );
}
