import { AlertTriangle, Banknote, CalendarClock, CreditCard, TrendingDown, TrendingUp } from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { compactCurrency } from "./dashboard-utils";

type CategorySummary = { id: string; name: string; total: number };
type BillSummary = {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  bill_type: "avulsa" | "fixa";
  computed_status: string;
  family_members: { name: string } | null;
};
type BankAccountSummary = {
  id: string;
  bank_name: string;
  account_type: string | null;
  current_balance: number;
  family_members: { name: string } | null;
};
type IncomeSummary = {
  id: string;
  source: string;
  income_type: "fixa" | "variavel";
  amount: number;
  family_members: { name: string } | null;
};

export function DashboardUpcomingBills({ canPayables, bills }: { canPayables: boolean; bills: BillSummary[] }) {
  if (!canPayables) return null;

  return (
    <AppCard className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <AppSectionTitle>Próximos vencimentos</AppSectionTitle>
          <p className="mt-1 text-sm text-white/35">Contas e dividas dentro do seu escopo</p>
        </div>
        <CalendarClock className="h-4 w-4 text-white/30" />
      </div>
      {bills.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Nenhuma conta ou divida pendente.</div>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <div key={bill.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <div className={bill.computed_status === "atrasado" ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0506e]/10 text-[#f0506e]" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f7b84b]/10 text-[#f7b84b]"}>
                {bill.computed_status === "atrasado" ? <AlertTriangle className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                    {bill.bill_type === "fixa" ? "fixa" : "avulsa"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-white/35">{bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
                <p className={bill.computed_status === "atrasado" ? "text-[10px] font-bold uppercase tracking-wider text-[#f0506e]" : "text-[10px] font-bold uppercase tracking-wider text-[#f7b84b]"}>{bill.computed_status}</p>
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
          <p className="mt-1 text-sm text-white/35">Maiores saídas liberadas</p>
        </div>
        <TrendingDown className="h-4 w-4 text-white/30" />
      </div>
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Cadastre gastos para ver categorias.</div>
      ) : (
        <div className="space-y-2">
          {categories.slice(0, 5).map((category, index) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white/45">{index + 1}</div>
                <p className="min-w-0 truncate text-sm font-semibold text-white/65">{category.name}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-white">{compactCurrency(category.total)}</p>
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
          <p className="mt-1 text-sm text-white/35">Saldos dentro do seu escopo</p>
        </div>
        <Banknote className="h-4 w-4 text-white/30" />
      </div>
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Nenhum banco cadastrado.</div>
      ) : (
        <div className="space-y-2">
          {accounts.slice(0, 4).map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{account.bank_name}</p>
                <p className="mt-0.5 truncate text-xs text-white/35">{account.family_members?.name || "Sem pessoa"} · {account.account_type || "Conta"}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(account.current_balance))}</p>
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
          <p className="mt-1 text-sm text-white/35">Entradas dentro do seu escopo</p>
        </div>
        <TrendingUp className="h-4 w-4 text-white/30" />
      </div>
      {incomes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Nenhuma renda cadastrada.</div>
      ) : (
        <div className="space-y-2">
          {incomes.slice(0, 4).map((income) => (
            <div key={income.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1de9b2]/10 text-[#1de9b2]">
                {income.income_type === "fixa" ? <CreditCard className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{income.source}</p>
                <p className="mt-0.5 truncate text-xs text-white/35">{income.family_members?.name || "Sem pessoa"} · {income.income_type}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}
