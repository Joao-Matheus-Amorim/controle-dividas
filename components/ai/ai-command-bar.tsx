"use client";

import * as React from "react";
import { Sparkles, Loader2, ExternalLink, Trash2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AiDraftPreviewCard,
  type DraftField,
} from "@/components/ai/ai-draft-preview-card";

const INTENT_ROUTES: Record<string, string> = {
  gasto: "gastos",
  conta_a_pagar: "contas-a-pagar",
  conta_a_receber: "contas-a-receber",
  banco: "bancos",
};

const SESSION_KEY = "ai_draft";

type BankOption = { id: string; name: string };

export interface AICommandBarProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  organizationId?: string | null;
  orgSlug?: string;
}

export function AICommandBar({
  className,
  placeholder = "O que aconteceu?",
  disabled = false,
  organizationId,
  orgSlug,
}: AICommandBarProps) {
  const [input, setInput] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState<{ intent: string; actionType: string; data: Record<string, unknown>; confidence: "high" | "medium" | "low" } | null>(null);
  const [actionType, setActionType] = React.useState<"pay" | "receive" | "delete" | null>(null);
  const [selectedBankId, setSelectedBankId] = React.useState("");
  const [confirmingAction, setConfirmingAction] = React.useState(false);

  const memberBankAccounts = React.useMemo(() => {
    if (!draft) return [];
    const raw = draft.data.memberBankAccounts;
    if (!Array.isArray(raw)) return [];
    return raw as BankOption[];
  }, [draft]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
    setMessage(null);
  };

  const handleOpenForm = () => {
    if (!draft) return;

    const at = draft.actionType;

    if (draft.intent === "acao_pagamento" || at === "pagar") {
      setSelectedBankId("");
      setActionType("pay");
      return;
    }

    if (at === "receber") {
      setSelectedBankId("");
      setActionType("receive");
      return;
    }

    if (at === "excluir") {
      setActionType("delete");
      return;
    }

    const route = INTENT_ROUTES[draft.intent];
    if (!route) return;

    sessionStorage.setItem("ai_origin", window.location.href);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(draft));
    window.location.href = orgSlug ? `/org/${orgSlug}/${route}` : `/protected/${route}`;
  };

  const handleConfirm = async () => {
    if (!draft || !organizationId || !actionType) return;

    setConfirmingAction(true);
    try {
      if (actionType === "pay") {
        const billId = draft.data.billId as string | undefined;
        if (!billId || !selectedBankId) return;

        const response = await fetch("/api/ai/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "mark_payable_paid",
            payload: { billId, bankId: selectedBankId },
            confirmation: "confirmado",
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Erro ao marcar como paga." }));
          setMessage(err.error ?? "Erro ao marcar como paga.");
          setConfirmingAction(false);
          setActionType(null);
          return;
        }

        setMessage("Conta marcada como paga com sucesso!");
        setDraft(null);
        setConfirmingAction(false);
        setActionType(null);
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      if (actionType === "receive") {
        const incomeId = draft.data.incomeId as string | undefined;
        if (!incomeId) return;

        const payload: Record<string, unknown> = { incomeId };
        if (selectedBankId) payload.bankId = selectedBankId;

        const response = await fetch("/api/ai/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "mark_receivable_received",
            payload,
            confirmation: "confirmado",
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Erro ao marcar como recebido." }));
          setMessage(err.error ?? "Erro ao marcar como recebido.");
          setConfirmingAction(false);
          setActionType(null);
          return;
        }

        setMessage("Recebimento marcado como recebido com sucesso!");
        setDraft(null);
        setConfirmingAction(false);
        setActionType(null);
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      if (actionType === "delete") {
        const recordId = draft.data.id as string | undefined;
        if (!recordId) return;

        const actionTypeMap: Record<string, string> = {
          gasto: "delete_expense",
          conta_a_pagar: "delete_payable_bill",
          conta_a_receber: "delete_receivable_income",
          banco: "delete_bank_account",
        };

        const apiActionType = actionTypeMap[draft.intent];
        if (!apiActionType) {
          setMessage("Nao foi possivel determinar o tipo de exclusao.");
          setConfirmingAction(false);
          setActionType(null);
          return;
        }

        const response = await fetch("/api/ai/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: apiActionType,
            payload: { id: recordId },
            confirmation: "confirmado",
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Erro ao excluir." }));
          setMessage(err.error ?? "Erro ao excluir.");
        } else {
          setMessage("Excluido com sucesso!");
          setDraft(null);
          setConfirmingAction(false);
          setActionType(null);
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
      }
    } catch {
      setMessage("Erro de rede ao confirmar a acao.");
    }

    setConfirmingAction(false);
    setActionType(null);
  };

  const handleDismissDraft = () => {
    setDraft(null);
  };

  const handleClearConversation = async () => {
    if (!organizationId) return;
    try {
      await fetch("/api/ai/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organizationId }),
      });
    } catch {
      // Silently fail — clear is a best-effort UX action
    }
    setMessage(null);
    setDraft(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled || loading) return;

    const text = input.trim();
    setInput("");
    setLoading(true);
    setDraft(null);

    if (!organizationId) {
      setMessage("Organizacao nao encontrada. Nada foi salvo.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, organization_id: organizationId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro de comunicacao" }));
        setMessage(err.error ?? "Nao foi possivel processar.");
      } else {
        const data = await response.json();
        const content = data.result?.content ?? "Nada foi salvo.";
        setMessage(content);

        if (data.result?.draft && data.result?.draftReady) {
          setDraft({
            intent: data.result.classification.intent,
            actionType: data.result.classification.actionType ?? "criar",
            data: data.result.draft,
            confidence: data.result.classification.confidence ?? "high",
          });
        }
      }
    } catch {
      setMessage("Erro de rede ao consultar o assistente.");
    }

    setLoading(false);
  };

  const buildDraftFields = React.useCallback(
    (at: "pay" | "receive" | "delete"): DraftField[] => {
      if (!draft) return [];
      const d = draft.data;
      const classifierConf: "alta" | "media" | "baixa" =
        draft.confidence === "high" ? "alta" : draft.confidence === "medium" ? "media" : "baixa";
      const confReason = draft.confidence === "high"
        ? undefined
        : draft.confidence === "medium"
        ? "A IA identificou parcialmente este dado. Verifique se esta correto."
        : "A IA nao tem certeza sobre este dado. Confira atentamente.";
      const missingReason = "Nao foi possivel extrair este dado do texto.";
      const resolved = (value: unknown): { confidence: "alta" | "media" | "baixa"; reason: string | undefined } => {
        if (!value) return { confidence: "baixa", reason: missingReason };
        return { confidence: classifierConf, reason: confReason };
      };

      if (at === "pay") {
        const billName = resolved(d.billName);
        const billAmount = resolved(d.billAmount);
        const billDueDate = resolved(d.billDueDate);
        const memberName = resolved(d.memberName);
        return [
          { key: "billName", label: "Conta", value: (d.billName as string) ?? null, ...billName, type: "text", required: true },
          { key: "billAmount", label: "Valor", value: (d.billAmount as number) ?? null, ...billAmount, type: "currency", required: true },
          { key: "billDueDate", label: "Vencimento", value: (d.billDueDate as string) ?? null, ...billDueDate, type: "date", required: true },
          { key: "memberName", label: "Membro", value: (d.memberName as string) ?? null, ...memberName, type: "text" },
        ];
      }

      if (at === "receive") {
        const incomeAmount = resolved(d.incomeAmount);
        const incomeDueDate = resolved(d.incomeDueDate);
        const memberName = resolved(d.memberName);
        return [
          { key: "incomeAmount", label: "Valor", value: (d.incomeAmount as number) ?? null, ...incomeAmount, type: "currency", required: true },
          { key: "incomeDueDate", label: "Data prevista", value: (d.incomeDueDate as string) ?? null, ...incomeDueDate, type: "date", required: true },
          { key: "memberName", label: "Membro", value: (d.memberName as string) ?? null, ...memberName, type: "text" },
        ];
      }

      const intentLabel =
        draft.intent === "gasto" ? "Gasto"
        : draft.intent === "conta_a_pagar" ? "Conta a pagar"
        : draft.intent === "conta_a_receber" ? "Conta a receber"
        : "Banco";
      const name = resolved(d.name ?? d.description ?? "");
      const amount = resolved(d.amount);
      return [
        { key: "type", label: "Tipo", value: intentLabel, confidence: "alta", type: "text" },
        { key: "name", label: "Registro", value: (d.name ?? d.description ?? "") as string || null, ...name, type: "text", required: true },
        { key: "amount", label: "Valor", value: (d.amount as number) ?? null, ...amount, type: "currency" },
      ];
    },
    [draft],
  );

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full space-y-2", className)}>
      <label htmlFor="ai-command-bar-input" className="sr-only">
        O que aconteceu?
      </label>
      <div className="relative flex h-11 w-full items-center overflow-hidden rounded-full border border-border bg-muted pl-4 pr-12 shadow-ff-xs transition-colors focus-within:border-primary focus-within:shadow-ff-sm">
        <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        <input
          id="ai-command-bar-input"
          type="text"
          value={input}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="h-full w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/75 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary p-1.5 text-primary-foreground transition-colors disabled:opacity-50 hover:bg-ff-primary-hover active:scale-95"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </button>
      </div>
      {message ? (
        <div className="flex flex-wrap items-center gap-2 px-4">
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            {message}
          </p>
          {draft ? (
            <>
              <button
                type="button"
                onClick={handleOpenForm}
                className="inline-flex items-center gap-1 rounded-full bg-ff-primary-soft px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                {draft.actionType === "pagar" || draft.intent === "acao_pagamento" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : draft.actionType === "receber" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : draft.actionType === "excluir" ? (
                  <Trash2 className="h-3 w-3" />
                ) : (
                  <ExternalLink className="h-3 w-3" />
                )}
                {draft.actionType === "pagar" || draft.intent === "acao_pagamento"
                  ? "Confirmar pagamento"
                  : draft.actionType === "receber"
                  ? "Confirmar recebimento"
                  : draft.actionType === "excluir"
                  ? "Confirmar exclusao"
                  : draft.actionType === "editar"
                  ? "Editar registro"
                  : "Revisar rascunho"}
              </button>
              <button
                type="button"
                onClick={handleDismissDraft}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <XCircle className="h-3 w-3" />
                Recusar rascunho
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={handleClearConversation}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" />
            Limpar conversa
          </button>
        </div>
      ) : null}

      <Dialog open={actionType !== null} onOpenChange={(open) => { if (!open) setActionType(null); }}>
        <DialogContent className="sm:max-w-md">
          {draft && actionType ? (
            <AiDraftPreviewCard
              operation={{
                action: actionType === "pay" ? "pay" : actionType === "receive" ? "receive" : "delete",
                intent: draft.intent,
              }}
              fields={buildDraftFields(actionType)}
              title={
                actionType === "pay" ? "Confirmar pagamento"
                : actionType === "receive" ? "Confirmar recebimento"
                : "Confirmar exclusao"
              }
              description={
                actionType === "pay" ? "Confirme os detalhes da conta a ser marcada como paga."
                : actionType === "receive" ? "Confirme os detalhes do recebimento a ser marcado como recebido."
                : "Esta acao nao pode ser desfeita."
              }
              extraContent={actionType !== "delete" ? (
                <div className="space-y-1.5 pt-2">
                  <label htmlFor="unified-bank-select" className="text-xs font-medium text-foreground">
                    {actionType === "pay" ? "Banco usado no pagamento" : "Banco usado (opcional)"}
                  </label>
                  <select
                    id="unified-bank-select"
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    required={actionType === "pay"}
                    className="h-9 w-full rounded-xl border border-border bg-muted px-2 text-xs text-foreground"
                  >
                    <option value="">{actionType === "pay" ? "Selecione um banco" : "Nao informar"}</option>
                    {memberBankAccounts.map((bank) => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>
              ) : undefined}
              confirmLabel={
                actionType === "pay" ? "Sim, marcar como paga"
                : actionType === "receive" ? "Sim, marcar como recebido"
                : "Sim, excluir"
              }
              confirmDisabled={actionType === "pay" && !selectedBankId}
              confirming={confirmingAction}
              destructive={actionType === "delete"}
              onConfirm={handleConfirm}
              onReject={() => setActionType(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </form>
  );
}
