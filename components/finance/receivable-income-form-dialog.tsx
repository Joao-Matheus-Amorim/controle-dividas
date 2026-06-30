"use client";

import { TrendingUp, XCircle } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { Button } from "@/components/ui/button";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import type {
  DbBankAccount,
  DbFamilyMember,
  DbReceivableIncomeSource,
} from "@/lib/finance/types";

const SESSION_KEY = "ai_draft";

function readAiDraft(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.intent === "conta_a_receber") {
      sessionStorage.removeItem(SESSION_KEY);
      return parsed.data ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export function ReceivableIncomeFormDialog({
  members,
  sources,
  bankAccounts,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
  sources: DbReceivableIncomeSource[];
  bankAccounts: DbBankAccount[];
  defaultMemberId?: string;
}) {
  const [initialDraft] = useState<Record<string, unknown> | null>(() => readAiDraft());
  const [open, setOpen] = useState(() => Boolean(initialDraft));
  const [formKey, setFormKey] = useState(0);
  const [draftData, setDraftData] = useState<Record<string, unknown> | null>(initialDraft);

  function handleSuccess() {
    setDraftData(null);
    setOpen(false);
    setFormKey((current) => current + 1);
  }

  function handleDismissDraft() {
    setDraftData(null);
    setFormKey((current) => current + 1);
  }

  return (
    <AppFormSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setDraftData(null);
        setOpen(next);
      }}
      title="Nova entrada"
      description="Cadastre salário, comissão, renda fixa ou recebimento pontual com pessoa, valor e data previstos."
      triggerLabel="Nova entrada"
      icon={TrendingUp}
    >
      {draftData ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-ff-lg border border-primary/20 bg-ff-primary-soft px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-primary">Rascunho gerado pela IA</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Os campos abaixo foram preenchidos com base na sugestão da IA. Recuse para começar do zero.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleDismissDraft} className="shrink-0 gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Recusar
          </Button>
        </div>
      ) : null}
      <ReceivableIncomeForm
        key={formKey}
        members={members}
        sources={sources}
        bankAccounts={bankAccounts}
        defaultMemberId={defaultMemberId}
        draftData={draftData ?? undefined}
        onSuccess={handleSuccess}
      />
    </AppFormSheet>
  );
}
