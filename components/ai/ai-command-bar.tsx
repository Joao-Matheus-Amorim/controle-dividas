"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { getAiFinanceClassifierIntentLabel } from "@/lib/finance/ai-finance-intent-classifier";
import { buildAiFinanceUniversalDraft } from "@/lib/finance/ai-finance-universal-draft";
import { cn } from "@/lib/utils";

export interface AICommandBarProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  organizationId?: string | null;
}

export function AICommandBar({
  className,
  placeholder = "O que aconteceu?",
  disabled = false,
  organizationId,
}: AICommandBarProps) {
  const [input, setInput] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled || loading) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    const draftResult = buildAiFinanceUniversalDraft({
      text,
      today: new Date().toISOString().slice(0, 10),
    });
    const { intent } = draftResult.classification;
    const intentLabel = getAiFinanceClassifierIntentLabel(intent);

    if (intent === "pergunta" && organizationId) {
      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, organization_id: organizationId }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Erro de comunicacao" }));
          setMessage(`Detectei ${intentLabel}. ${err.error ?? "Nao foi possivel processar."}`);
        } else {
          const data = await response.json();
          setMessage(data.result?.content ?? `Detectei ${intentLabel}. Nada foi salvo.`);
        }
      } catch {
        setMessage(`Detectei ${intentLabel}. Erro de rede ao consultar o assistente.`);
      }
    } else {
      const missing = draftResult.missingFields.length > 0
        ? ` Campos faltantes: ${draftResult.missingFields.join(", ")}.`
        : "";
      setMessage(`Detectei ${intentLabel}. Nada foi salvo.${missing}`);
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
        <p className="px-4 text-xs text-muted-foreground" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
