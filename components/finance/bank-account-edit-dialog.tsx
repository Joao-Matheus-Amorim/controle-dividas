"use client";

import { Pencil } from "lucide-react";

import { BankAccountForm } from "@/components/finance/bank-account-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbBankAccount } from "@/lib/finance/banks-server";
import type { DbFamilyMember } from "@/lib/finance/server";

export function BankAccountEditDialog({
  account,
  members,
}: {
  account: DbBankAccount;
  members: DbFamilyMember[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar banco"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar banco</DialogTitle>
          <DialogDescription>
            Atualize banco, pessoa vinculada, tipo de conta, saldo, moeda e observacoes.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <BankAccountForm members={members} account={account} mode="edit" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
