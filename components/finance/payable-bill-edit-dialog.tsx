"use client";

import { Pencil } from "lucide-react";

import { PayableBillForm } from "@/components/finance/payable-bill-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DbFamilyMember, DbPayableBill } from "@/lib/finance/server";

export function PayableBillEditDialog({
  bill,
  members,
}: {
  bill: DbPayableBill;
  members: DbFamilyMember[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar conta"
          className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar conta ou divida</DialogTitle>
          <DialogDescription>
            Atualize dados, tipo, responsavel, vencimento, status e observacoes.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <PayableBillForm members={members} bill={bill} mode="edit" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
