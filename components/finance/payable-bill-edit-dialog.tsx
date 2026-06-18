"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import { Button } from "@/components/ui/button";
import type {
  DbBankAccount,
  DbExpenseCategory,
  DbFamilyMember,
  DbPayableBill,
} from "@/lib/finance/types";

export function PayableBillEditDialog({
  bill,
  members,
  categories,
  bankAccounts,
}: {
  bill: DbPayableBill;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts: DbBankAccount[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <AppFormSheet
      open={open}
      onOpenChange={setOpen}
      title="Editar conta ou divida"
      description="Atualize dados, tipo, responsavel, vencimento, status e observacoes."
      triggerLabel="Editar conta"
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar conta"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      }
    >
      <PayableBillForm
        members={members}
        categories={categories}
        bankAccounts={bankAccounts}
        bill={bill}
        mode="edit"
        onSuccess={() => setOpen(false)}
      />
    </AppFormSheet>
  );
}
