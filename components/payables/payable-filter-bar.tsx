import Link from "next/link";

import {
  filterHref,
  statusFilters,
  type StatusFilter,
  type TypeFilter,
  typeFilters,
} from "./payable-utils";

interface PayableFilterBarProps {
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
}

export function PayableFilterBar({ statusFilter, typeFilter }: PayableFilterBarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background/40 p-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Link
              key={filter.value}
              href={filterHref(statusFilter, typeFilter, { status: filter.value })}
              className={
                statusFilter === filter.value
                  ? "rounded-full border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary"
                  : "rounded-full border border-border bg-ff-bg-soft px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-card hover:text-foreground"
              }
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">Tipo</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <Link
              key={filter.value}
              href={filterHref(statusFilter, typeFilter, { tipo: filter.value })}
              className={
                typeFilter === filter.value
                  ? "rounded-full border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary"
                  : "rounded-full border border-border bg-ff-bg-soft px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-card hover:text-foreground"
              }
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
