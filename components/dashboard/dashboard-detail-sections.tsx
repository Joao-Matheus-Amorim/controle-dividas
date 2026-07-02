import { AlertTriangle, Banknote, CalendarClock, CreditCard, TrendingDown, TrendingUp } from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { compactCurrencyForCode } from "./dashboard-utils";

type CategorySummary = { id: string; name: string; total: number; currency: string; totalLabel?: string; conversionIncomplete?: boolean };
type BillSummary = {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  currency: string;
  bill_type: "avulsa" | "fixa";
  computed_status: string;
  family_members: { name: string } | null;
};
type BankAccountSummary = {
  id: string;
  bank_name: string;
  account_type: string | null;
  current_balance: number;
  currency: string;
  family_members: { name: string } | null;
};
type IncomeSummary = {
  id: string;
  source: string | null;
  category?: string | null;
  income_type: "fixa" | "variavel";
  amount: number;
  currency: string;
  family_members: { name: string } | null;
};

export function DashboardUpcomingBills({ canPayables, bills }: { canPayables: boolean; bills: BillSummary[] }) {
  if (!canPayables) return null;

  return (
    <AppCard className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <AppSectionTitle>Próximos vencimentos</AppSectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Contas e dividas dentro do seu escopo</p>
        </div>
        <CalendarClock className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {bills.length === 0 ? (
        <div className="rounded-ff-md border border-border bg-ff-bg-soft p-4 text-sm text-muted-foreground">Nenhuma conta ou divida pendente.</div>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <div key={bill.id} className="flex items-center gap-3 rounded-ff-md border border-border bg-ff-bg-soft p-3">
              <div className={bill.computed_status === "atrasado" ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-ff-md bg-ff-destructive-soft text-ff-destructive" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-ff-md bg-ff-warning-soft text-ff-warning"}>
                {bill.computed_status === "atrasado" ? <AlertTriangle className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{bill.name}</p>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">
                    {bill.bill_type === "fixa" ? "fixa" : "avulsa"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-foreground">{compactCurrencyForCode(Number(bill.amount), bill.currency)}</p>
                <p className={bill.computed_status === "atrasado" ? "text-[10px] font-bold uppercase tracking-wider text-ff-destructive" : "text-[10px] font-bold uppercase tracking-wider text-ff-warning"}>{bill.computed_status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

export function DashboardCategorySummary({ canExpenses, categories }: { canExpenses: boolean; categories: CategorySummary[] }) {
  if (!canExpenses) return null;

  return (
    <AppCard className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <AppSectionTitle>Categorias</AppSectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Maiores saídas liberadas</p>
        </div>
        <TrendingDown className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {categories.length === 0 ? (
        <div className="rounded-ff-md border border-border bg-ff-bg-soft p-4 text-sm text-muted-foreground">Cadastre gastos para ver categorias.</div>
      ) : (
        <div className="space-y-2">
          {categories.slice(0, 5).map((category, index) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-ff-md border border-border bg-ff-bg-soft p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ff-sm bg-muted text-xs font-bold text-ff-subtle-foreground">{index + 1}</div>
                <p className="min-w-0 truncate text-sm font-semibold text-foreground">{category.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-foreground">{category.totalLabel ?? compactCurrencyForCode(category.total, category.currency)}</p>
                {category.conversionIncomplete ? <p className="text-[10px] font-bold uppercase tracking-wider text-ff-warning">conversao parcial</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

export function DashboardBankSummary({ canBanks, accounts }: { canBanks: boolean; accounts: BankAccountSummary[] }) {
  if (!canBanks) return null;

  return (
    <AppCard className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <AppSectionTitle>Bancos</AppSectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Saldos dentro do seu escopo</p>
        </div>
        <Banknote className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {accounts.length === 0 ? (
        <div className="rounded-ff-md border border-border bg-ff-bg-soft p-4 text-sm text-muted-foreground">Nenhum banco cadastrado.</div>
      ) : (
        <div className="space-y-2">
          {accounts.slice(0, 4).map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-3 rounded-ff-md border border-border bg-ff-bg-soft p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{account.bank_name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.family_members?.name || "Sem pessoa"} · {account.account_type || "Conta"}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-ff-success">{compactCurrencyForCode(Number(account.current_balance), account.currency)}</p>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

export function DashboardIncomeSummary({ canReceivables, incomes }: { canReceivables: boolean; incomes: IncomeSummary[] }) {
  if (!canReceivables) return null;

  return (
    <AppCard className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <AppSectionTitle>Rendas</AppSectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Entradas dentro do seu escopo</p>
        </div>
        <TrendingUp className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {incomes.length === 0 ? (
        <div className="rounded-ff-md border border-border bg-ff-bg-soft p-4 text-sm text-muted-foreground">Nenhuma renda cadastrada.</div>
      ) : (
        <div className="space-y-2">
          {incomes.slice(0, 4).map((income) => (
            <div key={income.id} className="flex items-center gap-3 rounded-ff-md border border-border bg-ff-bg-soft p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ff-md bg-ff-success-soft text-ff-success">
                {income.income_type === "fixa" ? <CreditCard className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{income.source || income.category || "Entrada sem origem"}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{income.family_members?.name || "Sem pessoa"} · {income.income_type}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-ff-success">{compactCurrencyForCode(Number(income.amount), income.currency)}</p>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}
