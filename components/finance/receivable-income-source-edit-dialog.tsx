"use client";

import { Pencil } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { ReceivableIncomeSourceForm } from "@/components/finance/receivable-income-source-form";
import { Button } from "@/components/ui/button";
import type { DbReceivableIncomeSource } from "@/lib/finance/types";

export function ReceivableIncomeSourceEditDialog({
  source,
}: {
  source: DbReceivableIncomeSource;
}) {
  return (
    <AppFormSheet
      title="Editar origem"
      description="Atualize nome e descricao da origem de recebimento."
      triggerLabel="Editar origem"
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Editar origem"
          className="h-9 w-9 rounded-xl border-border bg-transparent text-ff-subtle-foreground hover:bg-ff-bg-soft hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      }
    >
      <ReceivableIncomeSourceForm
        source={source}
        mode="edit"
        submitLayout="sheet"
      />
    </AppFormSheet>
  );
}
