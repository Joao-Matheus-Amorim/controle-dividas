"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeInputClass } from "@/components/finance/finance-form-ui";

type AssistedDraftReviewBoundaryProps = {
  value: string;
  applied: boolean;
  description: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onSuggest: () => void;
};

export function AssistedDraftReviewBoundary({
  value,
  applied,
  description,
  placeholder,
  onValueChange,
  onSuggest,
}: AssistedDraftReviewBoundaryProps) {
  return (
    <section className="rounded-[1.25rem] border border-border bg-ff-bg-soft p-3.5 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Rascunho assistido
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {applied ? (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            rascunho aplicado
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          className={financeInputClass}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-2xl px-4"
          onClick={onSuggest}
          disabled={!value.trim()}
        >
          <Sparkles className="h-4 w-4" />
          Sugerir
        </Button>
      </div>
    </section>
  );
}
