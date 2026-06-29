"use client";

import { Banknote } from "lucide-react";
import { useState } from "react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { BankAccountForm } from "@/components/finance/bank-account-form";
import type { DbFamilyMember } from "@/lib/finance/types";

const SESSION_KEY = "ai_draft";

function readAiDraft(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.intent === "banco") {
      sessionStorage.removeItem(SESSION_KEY);
      return parsed.data ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export function BankAccountFormDialog({
  members,
  defaultMemberId,
}: {
  members: DbFamilyMember[];
  defaultMemberId?: string;
}) {
  const [open, setOpen] = useState(() => !!readAiDraft());
  const [formKey, setFormKey] = useState(0);
  const [draftData, setDraftData] = useState<Record<string, unknown> | null>(() => readAiDraft());

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
      title="Novo banco"
      description="Cadastre uma conta, banco, cartão ou saldo em dinheiro."
      triggerLabel="Novo banco"
      icon={Banknote}
    >
      <BankAccountForm
        key={formKey}
        members={members}
        defaultMemberId={defaultMemberId}
        draftData={draftData ?? undefined}
        onSuccess={handleSuccess}
      />
    </AppFormSheet>
  );
}
