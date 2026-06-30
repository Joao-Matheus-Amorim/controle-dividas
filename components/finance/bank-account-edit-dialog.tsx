"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { BankAccountForm } from "@/components/finance/bank-account-form";
import { Button } from "@/components/ui/button";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";

export function BankAccountEditDialog({
  account,
  members,
}: {
  account: DbBankAccount;
  members: DbFamilyMember[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <AppFormSheet
      open={open}
      onOpenChange={setOpen}
      title="Editar banco"
      description="Atualize banco, pessoa vinculada, tipo de conta, saldo, moeda e observacoes."
      triggerLabel="Editar banco"
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar banco"
          className="h-9 w-9 rounded-xl border-border bg-transparent text-ff-subtle-foreground hover:bg-ff-bg-soft hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      }
    >
      <BankAccountForm
        members={members}
        account={account}
        mode="edit"
        onSuccess={() => setOpen(false)}
      />
    </AppFormSheet>
  );
}
