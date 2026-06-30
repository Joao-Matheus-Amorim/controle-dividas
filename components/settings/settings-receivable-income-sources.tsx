import { ReceivableIncomeSourceEditDialog } from "@/components/finance/receivable-income-source-edit-dialog";
import { ReceivableIncomeSourceForm } from "@/components/finance/receivable-income-source-form";
import { Badge } from "@/components/ui/badge";
import type { DbReceivableIncomeSource } from "@/lib/finance/types";
import { SettingsReceivableIncomeSourceDeleteForm } from "./settings-receivable-income-source-delete-form";

interface SettingsReceivableIncomeSourcesProps {
  sources: DbReceivableIncomeSource[];
  canManageSources?: boolean;
}

export function SettingsReceivableIncomeSources({
  sources,
  canManageSources = false,
}: SettingsReceivableIncomeSourcesProps) {
  return (
    <section className={canManageSources ? "grid gap-4 xl:grid-cols-[0.9fr_1.1fr]" : "grid gap-4"}>
      {canManageSources ? (
        <div className="rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Nova origem</p>
            <p className="text-xs font-semibold text-primary">formulario</p>
          </div>
          <ReceivableIncomeSourceForm />
        </div>
      ) : null}

      <div className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Origens de recebimento</p>
          <p className="text-xs font-semibold text-primary">{sources.length}</p>
        </div>
        {sources.map((source) => (
          <div key={source.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background/50 p-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{source.name}</p>
                {source.is_default ? <Badge variant="secondary">padrao</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-ff-subtle-foreground">{source.description || "Sem descricao"}</p>
            </div>

            {!source.is_default && canManageSources ? (
              <div className="flex items-start gap-2">
                <ReceivableIncomeSourceEditDialog source={source} />
                <SettingsReceivableIncomeSourceDeleteForm sourceId={source.id} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
