import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Repeat2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { PayableBillDeleteDialog } from "@/components/finance/payable-bill-delete-dialog";
import { PayableBillEditDialog } from "@/components/finance/payable-bill-edit-dialog";
import { PayableBillFormDialog } from "@/components/finance/payable-bill-form-dialog";
import { PayableBillStatusForm } from "@/components/finance/payable-bill-status-form";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { formatCurrency } from "@/lib/finance/calculations";
import { getPayableBillsDashboardData } from "@/lib/finance/server";

type StatusFilter = "todos" | "pendente" | "atrasado" | "pago";
type TypeFilter = "todas" | "avulsa" | "fixa";
type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type ContasAPagarPageProps = {
  searchParams?: PageSearchParams;
};

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "atrasado", label: "Atrasadas" },
  { value: "pago", label: "Pagas" },
];

const typeFilters: Array<{ value: TypeFilter; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "avulsa", label: "Avulsas" },
  { value: "fixa", label: "Fixas" },
];

function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "pago") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

function getSearchValue(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatusFilter(value: string | undefined): StatusFilter {
  if (value === "pendente" || value === "atrasado" || value === "pago") {
    return value;
  }

  return "todos";
}

function normalizeTypeFilter(value: string | undefined): TypeFilter {
  if (value === "avulsa" || value === "fixa") {
    return value;
  }

  return "todas";
}

export default async function ContasAPagarPage({ searchParams }: ContasAPagarPageProps) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(getSearchValue(params, "status"));
  const typeFilter = normalizeTypeFilter(getSearchValue(params, "tipo"));

  const [profile, payableData] = await Promise.all([
    getCurrentProfile(),
    getPayableBillsDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "CONTAS_A_PAGAR");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);

  const {
    members,
    bills,
    totalPending,
    totalOverdue,
    totalPaid,
    totalOneOff,
    totalFixed,
    pendingCount,
    overdueCount,
    oneOffCount,
    fixedCount,
  } = payableData;

  const filteredBills = bills.filter((bill) => {
    const statusMatches = statusFilter === "todos" || bill.computed_status === statusFilter;
    const typeMatches = typeFilter === "todas" || bill.bill_type === typeFilter;

    return statusMatches && typeMatches;
  });

  function filterHref(nextFilters: Partial<{ status: StatusFilter; tipo: TypeFilter }>) {
    const nextStatus = nextFilters.status ?? statusFilter;
    const nextType = nextFilters.tipo ?? typeFilter;
    const nextParams = new URLSearchParams();

    if (nextStatus !== "todos") {
      nextParams.set("status", nextStatus);
    }

    if (nextType !== "todas") {
      nextParams.set("tipo", nextType);
    }

    const query = nextParams.toString();
    return query ? `/protected/contas-a-pagar?${query}` : "/protected/contas-a-pagar";
  }

  const hasActiveFilters = statusFilter !== "todos" || typeFilter !== "todas";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Junho</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Contas e dividas</h1>
          <p className="mt-1 text-sm text-white/40">Contas fixas, avulsas, pagamentos e vencimentos</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#f7b84b]">
          <WalletCards className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#f7b84b]/20 bg-[linear-gradient(135deg,#2a1a08_0%,#140c05_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f7b84b]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Total em aberto</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {compactCurrency(totalPending + totalOverdue)}
          </p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Pendentes</p>
              <p className="mt-1 text-sm font-semibold text-[#f7b84b]">{pendingCount} · {compactCurrency(totalPending)}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Atrasadas</p>
              <p className="mt-1 text-sm font-semibold text-[#f0506e]">{overdueCount} · {compactCurrency(totalOverdue)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CalendarDays className="h-4 w-4 text-[#f7b84b]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pendentes</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalPending)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <AlertTriangle className="h-4 w-4 text-[#f0506e]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Atraso</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalOverdue)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CheckCircle2 className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pagas</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <WalletCards className="h-4 w-4 text-[#8b72f8]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Avulsas</p>
          <p className="mt-1 text-sm font-bold text-white">{oneOffCount} · {compactCurrency(totalOneOff)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Repeat2 className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Fixas</p>
          <p className="mt-1 text-sm font-bold text-white">{fixedCount} · {compactCurrency(totalFixed)}</p>
        </div>
      </section>

      {canCreate ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova conta/divida</p>
              <p className="mt-1 text-sm text-white/40">Cadastre uma conta avulsa ou uma conta fixa mensal.</p>
            </div>
            <PayableBillFormDialog members={members} />
          </div>
        </section>
      ) : null}

      <section className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Contas e dividas cadastradas</p>
            <p className="mt-1 text-sm text-white/35">
              {filteredBills.length} de {bills.length} itens visiveis no seu escopo.
            </p>
          </div>
          {hasActiveFilters ? (
            <Link href="/protected/contas-a-pagar" className="text-xs font-semibold text-[#8b72f8] underline-offset-4 hover:underline">
              Limpar filtros
            </Link>
          ) : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#080810]/40 p-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">Status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Link
                  key={filter.value}
                  href={filterHref({ status: filter.value })}
                  className={
                    statusFilter === filter.value
                      ? "rounded-full border border-[#8b72f8]/50 bg-[#8b72f8]/15 px-3 py-1.5 text-xs font-semibold text-[#b09cff]"
                      : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/45 transition hover:bg-white/[0.07] hover:text-white"
                  }
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">Tipo</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {typeFilters.map((filter) => (
                <Link
                  key={filter.value}
                  href={filterHref({ tipo: filter.value })}
                  className={
                    typeFilter === filter.value
                      ? "rounded-full border border-[#8b72f8]/50 bg-[#8b72f8]/15 px-3 py-1.5 text-xs font-semibold text-[#b09cff]"
                      : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/45 transition hover:bg-white/[0.07] hover:text-white"
                  }
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {bills.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">
            Nenhuma conta ou divida cadastrada ainda. Crie uma conta avulsa ou fixa para acompanhar vencimentos.
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">
            Nenhuma conta encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredBills.map((bill) => (
            <div key={bill.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                  <Badge variant={bill.bill_type === "fixa" ? "secondary" : "outline"}>
                    {bill.bill_type === "fixa" ? "fixa" : "avulsa"}
                  </Badge>
                  <Badge variant={statusVariant(bill.computed_status)}>{bill.computed_status}</Badge>
                  {bill.recurrence ? <Badge variant="outline" className="border-white/10 text-white/50">{bill.recurrence}</Badge> : null}
                </div>
                <p className="mt-1 truncate text-xs text-white/35">{bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}</p>
                <p className="mt-0.5 truncate text-xs text-white/25">Vencimento: {new Date(`${bill.due_date}T00:00:00`).toLocaleDateString("pt-BR")}{bill.bank_used ? ` · ${bill.bank_used}` : ""}</p>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
                {canEdit ? (
                  <>
                    <PayableBillEditDialog bill={bill} members={members} />
                    <PayableBillStatusForm bill={bill} />
                  </>
                ) : null}
                {canDelete ? <PayableBillDeleteDialog bill={bill} /> : null}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
