import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import type { DbExpenseCategory, DbFamilyMember } from "@/lib/finance/server";

interface ExpenseCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
}

export function ExpenseCreateSection({
  canCreate,
  members,
  categories,
}: ExpenseCreateSectionProps) {
  if (!canCreate) return null;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Novo gasto</p>
          <p className="mt-1 text-sm text-white/40">Registre um lançamento sem poluir a tela principal.</p>
        </div>
        <ExpenseFormDialog members={members} categories={categories} />
      </div>
    </section>
  );
}
