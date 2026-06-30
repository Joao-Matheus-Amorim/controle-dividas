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
    <div className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Gastos por pessoa</p>
        <Users className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {people.length === 0 ? (
        <p className="text-sm text-ff-subtle-foreground">Nenhuma pessoa cadastrada.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <div key={person.id} className="min-w-0 rounded-2xl border border-border bg-background/50 p-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {initials(person.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{person.name}</p>
                  <p className="text-xs text-ff-subtle-foreground">{person.usedPercent.toFixed(1)}%</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{compactCurrency(person.spent)}</p>
              <p className={person.exceeded ? "mt-1 text-xs font-semibold text-ff-destructive" : "mt-1 text-xs font-semibold text-ff-success"}>
                saldo {compactCurrency(person.remaining)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
