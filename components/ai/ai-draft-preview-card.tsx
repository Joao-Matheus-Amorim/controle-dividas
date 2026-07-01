"use client";

import * as React from "react";
import { CheckCircle, AlertCircle, HelpCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type FieldConfidence = "alta" | "media" | "baixa";

export type DraftField = {
  key: string;
  label: string;
  value: string | number | null | undefined;
  confidence: FieldConfidence;
  type: "text" | "currency" | "date" | "select" | "member" | "category" | "bank" | "boolean";
  required?: boolean;
  reason?: string;
  options?: { value: string; label: string }[];
  onChange?: (value: string) => void;
};

export type DraftOperation =
  | { action: "create"; intent: string }
  | { action: "update"; intent: string }
  | { action: "delete"; intent: string }
  | { action: "pay"; intent: string }
  | { action: "receive"; intent: string };

export interface AiDraftPreviewCardProps {
  operation: DraftOperation;
  fields: DraftField[];
  title?: string;
  description?: string;
  extraContent?: React.ReactNode;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirming?: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onEdit?: () => void;
  destructive?: boolean;
  className?: string;
}

function ConfidenceIcon({ confidence }: { confidence: FieldConfidence }) {
  if (confidence === "alta") {
    return <CheckCircle className="h-3.5 w-3.5 shrink-0 text-ff-success" />;
  }
  if (confidence === "media") {
    return <HelpCircle className="h-3.5 w-3.5 shrink-0 text-ff-warning" />;
  }
  return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-ff-destructive" />;
}

function FormatValue({ field }: { field: DraftField }) {
  if (field.value === null || field.value === undefined || field.value === "") {
    return (
      <span className="italic text-muted-foreground/60">
        {field.confidence === "baixa" ? "Pendente" : "Nao informado"}
      </span>
    );
  }
  if (field.type === "currency") {
    const num = Number(field.value);
    if (!Number.isFinite(num)) return <span>{String(field.value)}</span>;
    return (
      <span>
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR" }).format(num)}
      </span>
    );
  }
  if (field.type === "boolean") {
    return (
      <span className={String(field.value) === "true" ? "text-ff-success" : "text-muted-foreground"}>
        {String(field.value) === "true" ? "Sim" : "Nao"}
      </span>
    );
  }
  return <span>{String(field.value)}</span>;
}

function FieldRow({ field }: { field: DraftField }) {
  const [showReason, setShowReason] = React.useState(false);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
        field.confidence === "alta" && "bg-transparent",
        field.confidence === "media" && "bg-ff-warning/5",
        field.confidence === "baixa" && field.required && "bg-ff-destructive/5 ring-1 ring-ff-destructive/20",
        field.confidence === "baixa" && !field.required && "bg-muted/30",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <ConfidenceIcon confidence={field.confidence} />
        <span className="shrink-0 text-ff-subtle-foreground">{field.label}</span>
        {field.required && field.confidence !== "alta" && (
          <span className="text-ff-destructive">*</span>
        )}
        {field.reason && field.confidence !== "alta" && (
          <button
            type="button"
            onClick={() => setShowReason(!showReason)}
            className="rounded px-1 py-0.5 text-ff-subtle-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            title="Por que este valor?"
          >
            ?
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 text-right shrink-0 max-w-[55%]">
        <FormatValue field={field} />
        {field.options && (field.value === null || field.value === undefined || field.value === "") && (
          <select
            value=""
            onChange={(e) => field.onChange?.(e.target.value)}
            className="h-7 max-w-[140px] rounded-md border border-border bg-muted px-2 text-xs text-foreground"
          >
            <option value="">Selecionar...</option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function OperationBadge({ operation }: { operation: DraftOperation }) {
  const config = {
    create: { label: "Novo registro", className: "bg-ff-primary-soft text-primary" },
    update: { label: "Alteracao", className: "bg-ff-warning/10 text-ff-warning" },
    delete: { label: "Exclusao", className: "bg-ff-destructive/10 text-ff-destructive" },
    pay: { label: "Pagamento", className: "bg-ff-success/10 text-ff-success" },
    receive: { label: "Recebimento", className: "bg-ff-success/10 text-ff-success" },
  };
  const c = config[operation.action];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", c.className)}>
      {c.label}
    </span>
  );
}

function countLowConfidenceRequired(fields: DraftField[]): number {
  return fields.filter((f) => f.confidence === "baixa" && f.required).length;
}

export function AiDraftPreviewCard({
  operation,
  fields,
  title,
  description,
  extraContent,
  confirmLabel,
  confirmDisabled,
  confirming = false,
  onConfirm,
  onReject,
  onEdit,
  destructive = false,
  className,
}: AiDraftPreviewCardProps) {
  const lowRequired = countLowConfidenceRequired(fields);
  const disableConfirm = confirmDisabled ?? lowRequired > 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              {title ?? "Revisar dados"}
            </h4>
            <OperationBadge operation={operation} />
          </div>
          {description && (
            <p className="text-xs text-ff-subtle-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className="space-y-0.5 rounded-ff-lg border border-border bg-card p-2">
        {fields.map((field) => (
          <FieldRow key={field.key} field={field} />
        ))}
      </div>

      {extraContent}

      {lowRequired > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-ff-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Preencha os campos obrigatorios antes de confirmar.
        </p>
      )}

      {operation.action === "delete" && (
        <p className="flex items-center gap-1.5 rounded-lg bg-ff-destructive/10 px-3 py-2 text-xs text-ff-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Esta acao nao pode ser desfeita.
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onReject}>
          <XCircle className="h-3.5 w-3.5" />
          Recusar
        </Button>
        {onEdit && (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Editar no formulario
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant={destructive ? "destructive" : "default"}
          disabled={disableConfirm || confirming}
          onClick={onConfirm}
        >
          {confirming ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : destructive ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          {confirming ? "Confirmando..." : confirmLabel ?? "Confirmar"}
        </Button>
      </div>
    </div>
  );
}
