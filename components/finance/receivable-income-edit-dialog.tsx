"use client";

import { Pencil } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import { Button } from "@/components/ui/button";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";

export function ReceivableIncomeEditDialog({
  income,
  members,
}: {
  income: DbReceivableIncome;
  members: DbFamilyMember[];
}) {
  return (
    <AppFormSheet
      title="Editar recebimento"
      description="Atualize pessoa, origem, valor, data, status, banco e observações."
      triggerLabel="Editar recebimento"
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar recebimento"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      }
    >
      <ReceivableIncomeForm members={members} income={income} mode="edit" />
    </AppFormSheet>
  );
}
