import { Users } from "lucide-react";

import { compactCurrency, initials } from "./report-utils";

type ExpenseByPerson = {
  id: string;
  name: string;
  spent: number;
  remaining: number;
  usedPercent: number;
  exceeded: boolean;
};

interface ReportExpensesByPersonProps {
  people: ExpenseByPerson[];
}

export function ReportExpensesByPerson({ people }: ReportExpensesByPersonProps) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Gastos por pessoa</p>
        <Users className="h-4 w-4 text-white/30" />
      </div>
      {people.length === 0 ? (
        <p className="text-sm text-white/35">Nenhuma pessoa cadastrada.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {people.map((person) => (
            <div key={person.id} className="min-w-[116px] rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">
                  {initials(person.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{person.name}</p>
                  <p className="text-xs text-white/35">{person.usedPercent.toFixed(1)}%</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-white">{compactCurrency(person.spent)}</p>
              <p className={person.exceeded ? "mt-1 text-xs font-semibold text-[#f0506e]" : "mt-1 text-xs font-semibold text-[#1de9b2]"}>
                saldo {compactCurrency(person.remaining)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
