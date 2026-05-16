import { type BadgeProps } from "@/components/ui/badge";
import { compactCurrency } from "@/lib/finance/formatting";

export { compactCurrency };

export type StatusFilter = "todos" | "pendente" | "atrasado" | "pago";
export type TypeFilter = "todas" | "avulsa" | "fixa";

export const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "atrasado", label: "Atrasadas" },
  { value: "pago", label: "Pagas" },
];

export const typeFilters: Array<{ value: TypeFilter; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "avulsa", label: "Avulsas" },
  { value: "fixa", label: "Fixas" },
];

export function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "pago") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}

export function getSearchValue(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeStatusFilter(value: string | undefined): StatusFilter {
  if (value === "pendente" || value === "atrasado" || value === "pago") {
    return value;
  }

  return "todos";
}

export function normalizeTypeFilter(value: string | undefined): TypeFilter {
  if (value === "avulsa" || value === "fixa") {
    return value;
  }

  return "todas";
}

export function filterHref(
  statusFilter: StatusFilter,
  typeFilter: TypeFilter,
  nextFilters: Partial<{ status: StatusFilter; tipo: TypeFilter }>,
) {
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
