import { ExpenseListClient } from "@/components/finance/expense-list-client";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

interface ExpenseListSectionProps {
  expenses: DbExpense[];
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  canEdit: boolean;
  canDelete: boolean;
}

export function ExpenseListSection({
  expenses,
  members,
  categories,
  canEdit,
  canDelete,
}: ExpenseListSectionProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Gastos cadastrados</p>
        <p className="text-xs font-semibold text-[#8b72f8]">{expenses.length}</p>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-white/35">Nenhum gasto cadastrado ainda.</p>
      ) : (
        <ExpenseListClient
          expenses={expenses}
          members={members}
          categories={categories}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </section>
  );
}
