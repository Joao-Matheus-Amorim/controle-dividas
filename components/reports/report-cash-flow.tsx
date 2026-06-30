import { Landmark, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { compactCurrency } from "./report-utils";

type CashFlowByBank = {
  id: string;
  name: string;
  accountType: string | null;
  currency: string;
  inflow: number;
  outflow: number;
  net: number;
  movementCount: number;
};

type ReportCashFlowProps = {
  totalInflow: number;
  totalOutflow: number;
  netTotal: number;
  cashFlowByBank: CashFlowByBank[];
  movementCount: number;
};

export function ReportCashFlow({
  totalInflow,
  totalOutflow,
  netTotal,
  cashFlowByBank,
  movementCount,
}: ReportCashFlowProps) {
  const maxBankValue = Math.max(
    1,
    ...cashFlowByBank.map((bank) => Math.max(bank.inflow, bank.outflow)),
  );

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">
            Fluxo realizado
          </p>
          <p className="mt-1 text-sm text-ff-subtle-foreground">
            Entradas e saidas registradas no livro caixa.
          </p>
        </div>
        <Badge variant={netTotal >= 0 ? "secondary" : "destructive"}>
          {movementCount} lancamentos
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Entradas</p>
            <TrendingUp className="h-4 w-4 text-ff-success" />
          </div>
          <p className="mt-2 text-lg font-bold text-ff-success">{compactCurrency(totalInflow)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Saidas</p>
            <TrendingDown className="h-4 w-4 text-ff-destructive" />
          </div>
          <p className="mt-2 text-lg font-bold text-ff-destructive">{compactCurrency(totalOutflow)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Resultado</p>
            <Landmark className="h-4 w-4 text-ff-subtle-foreground" />
          </div>
          <p className={netTotal >= 0
            ? "mt-2 text-lg font-bold text-ff-success"
            : "mt-2 text-lg font-bold text-ff-destructive"}
          >
            {compactCurrency(netTotal)}
          </p>
        </div>
      </div>

      {cashFlowByBank.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background/45 p-4 text-sm text-ff-subtle-foreground">
          Nenhum lancamento financeiro no periodo filtrado.
        </div>
      ) : (
        <div className="space-y-3">
          {cashFlowByBank.map((bank) => (
            <div key={bank.id} className="space-y-2 rounded-2xl border border-border bg-background/45 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{bank.name}</p>
                  <p className="text-xs text-ff-subtle-foreground">
                    {[bank.accountType, bank.currency].filter(Boolean).join(" - ")}
                  </p>
                </div>
                <p className={bank.net >= 0 ? "text-sm font-bold text-ff-success" : "text-sm font-bold text-ff-destructive"}>
                  {compactCurrency(bank.net)}
                </p>
              </div>
              <div className="grid gap-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-ff-success-soft"
                    style={{ width: `${Math.max(4, (bank.inflow / maxBankValue) * 100)}%` }}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-ff-destructive"
                    style={{ width: `${Math.max(4, (bank.outflow / maxBankValue) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-ff-subtle-foreground">
                {compactCurrency(bank.inflow)} entradas / {compactCurrency(bank.outflow)} saidas
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
