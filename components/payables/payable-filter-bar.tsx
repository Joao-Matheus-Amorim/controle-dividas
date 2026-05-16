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
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#080810]/40 p-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Link
              key={filter.value}
              href={filterHref(statusFilter, typeFilter, { status: filter.value })}
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
              href={filterHref(statusFilter, typeFilter, { tipo: filter.value })}
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
  );
}
