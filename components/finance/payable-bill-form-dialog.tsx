"use client";

import { WalletCards } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import type { DbBankAccount, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

const SESSION_KEY = "ai_draft";

function readAiDraft(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.intent === "conta_a_pagar") {
      sessionStorage.removeItem(SESSION_KEY);
      return parsed.data ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export function PayableBillFormDialog({
  members,
  categories,
  bankAccounts,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
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

  return (
    <AppFormSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setDraftData(null);
        setOpen(next);
      }}
      title="Nova conta ou divida"
      description="Cadastre uma conta avulsa ou uma conta fixa mensal."
      triggerLabel="Nova conta/divida"
      icon={WalletCards}
    >
      <PayableBillForm
        key={formKey}
        members={members}
        categories={categories}
        bankAccounts={bankAccounts}
        defaultMemberId={defaultMemberId}
        draftData={draftData ?? undefined}
        onSuccess={handleSuccess}
      />
    </AppFormSheet>
  );
}
