import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

export type ExpenseFilters = {
  memberId: string;
  categoryId: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
};

interface ExpenseFilterBarProps {
  filters: ExpenseFilters;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  paymentMethods: string[];
  hasActiveFilters: boolean;
}

export function ExpenseFilterBar({
  filters,
  members,
  categories,
  paymentMethods,
  hasActiveFilters,
}: ExpenseFilterBarProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Filtros</p>
          <p className="mt-1 text-sm text-white/35">Refine os gastos por pessoa, categoria, período e pagamento.</p>
        </div>
        {hasActiveFilters ? (
          <Link href="/protected/gastos" className="text-xs font-semibold text-[#8b72f8] underline-offset-4 hover:underline">
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <form className="grid gap-3 md:grid-cols-5" method="get">
        <select name="pessoa" defaultValue={filters.memberId} className="h-10 rounded-xl border border-white/10 bg-[#080810] px-3 text-sm text-white">
          <option value="">Todas as pessoas</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>

        <select name="categoria" defaultValue={filters.categoryId} className="h-10 rounded-xl border border-white/10 bg-[#080810] px-3 text-sm text-white">
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <select name="pagamento" defaultValue={filters.paymentMethod} className="h-10 rounded-xl border border-white/10 bg-[#080810] px-3 text-sm text-white">
          <option value="">Todos os pagamentos</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>

        <Input name="de" type="date" defaultValue={filters.dateFrom} className="h-10 rounded-xl" />
        <Input name="ate" type="date" defaultValue={filters.dateTo} className="h-10 rounded-xl" />

        <div className="md:col-span-5">
          <Button type="submit" variant="outline" className="h-10 rounded-xl border-white/10 bg-transparent text-white/70 hover:bg-white/10 hover:text-white">
            Aplicar filtros
          </Button>
        </div>
      </form>
    </section>
  );
}
