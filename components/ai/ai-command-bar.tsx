"use client";

import * as React from "react";
import { Sparkles, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const INTENT_ROUTES: Record<string, string> = {
  gasto: "gastos",
  conta_a_pagar: "contas-a-pagar",
  conta_a_receber: "contas-a-receber",
  banco: "bancos",
};

const SESSION_KEY = "ai_draft";

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
  const router = useRouter();
  const [input, setInput] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState<{ intent: string; data: Record<string, unknown> } | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
    setMessage(null);
  };

  const handleOpenForm = () => {
    if (!draft || !orgSlug) return;

    const route = INTENT_ROUTES[draft.intent];
    if (!route) return;

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(draft));
    router.push(`/org/${orgSlug}/${route}`);
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
            data: data.result.draft,
          });
        }
      }
    } catch {
      setMessage("Erro de rede ao consultar o assistente.");
    }

    setLoading(false);
  };

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
            <button
              type="button"
              onClick={handleOpenForm}
              className="inline-flex items-center gap-1 rounded-full bg-ff-primary-soft px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir formulario
            </button>
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
    </form>
  );
}
