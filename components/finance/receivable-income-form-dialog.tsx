"use client";

import { TrendingUp, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { Button } from "@/components/ui/button";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import type {
  DbBankAccount,
  DbFamilyMember,
  DbReceivableIncomeSource,
} from "@/lib/finance/types";

const SESSION_KEY = "ai_draft";

function readAiDraft(): { data: Record<string, unknown>; actionType: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.intent === "conta_a_receber") {
      sessionStorage.removeItem(SESSION_KEY);
      return { data: parsed.data ?? {}, actionType: parsed.actionType ?? "criar" };
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
  const [initialDraft] = useState<{ data: Record<string, unknown>; actionType: string } | null>(() => readAiDraft());
  const [open, setOpen] = useState(() => Boolean(initialDraft));
  const [formKey, setFormKey] = useState(0);
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [draftData, setDraftData] = useState<Record<string, unknown> | null>(initialDraft?.data ?? null);

  const isEdit = Boolean(initialDraft?.actionType === "editar" && initialDraft?.data?.id);

  useEffect(() => {
    if (isEdit && initialDraft?.data?.id && open) {
      setLoadingRecord(true);
      fetch(`/api/finance/get-record?entity=receivable_income&id=${initialDraft.data.id}`)
        .then((res) => res.json())
        .then((json) => { if (json.result) setEditRecord(json.result); })
        .catch(() => {})
        .finally(() => setLoadingRecord(false));
    }
  }, [isEdit, initialDraft?.data?.id, open]);

  function handleSuccess() {
    setDraftData(null);
    setOpen(false);
    setFormKey((current) => current + 1);
    const origin = sessionStorage.getItem("ai_origin");
    if (origin) {
      sessionStorage.removeItem("ai_origin");
      setTimeout(() => { window.location.href = origin; }, 100);
    }
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
      title={isEdit ? "Editar entrada" : "Nova entrada"}
      description={isEdit ? "Atualize os dados do recebimento." : "Cadastre salario, comissao, renda fixa ou recebimento pontual."}
      triggerLabel="Nova entrada"
      icon={TrendingUp}
    >
      {loadingRecord ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando registro...</span>
        </div>
      ) : draftData && !isEdit ? (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-ff-lg border border-primary/20 bg-ff-primary-soft px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-primary">Rascunho gerado pela IA</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Os campos abaixo foram preenchidos com base na sugestao da IA. Recuse para comecar do zero.
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
        mode={isEdit && editRecord ? "edit" : "create"}
        income={isEdit && editRecord ? (editRecord as never) : undefined}
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
