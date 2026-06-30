import Link from "next/link";
import { PlusCircle, ReceiptText } from "lucide-react";

import { AppEmptyState } from "@/components/app/app-empty-state";
import { ExpenseListClient } from "@/components/finance/expense-list-client";
import { Button } from "@/components/ui/button";
import type { DbBankAccount, DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

interface ExpenseListSectionProps {
  expenses: DbExpense[];
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts: DbBankAccount[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

export function ExpenseListSection({
  expenses,
  members,
  categories,
  bankAccounts,
  canEdit,
  canDelete,
  canCreate,
}: ExpenseListSectionProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Gastos cadastrados</p>
        <p className="text-xs font-semibold text-primary">{expenses.length}</p>
      </div>

      {expenses.length === 0 ? (
        <AppEmptyState
          icon={ReceiptText}
          title="Nenhum gasto cadastrado"
          description="Registre um gasto para acompanhar impacto por pessoa, categoria e banco."
          action={
            canCreate ? (
              <Button asChild size="sm" className="h-10 w-full rounded-2xl bg-primary px-4 font-bold text-foreground hover:bg-ff-primary-hover sm:w-auto">
                <Link href="#novo-gasto">
                  <PlusCircle className="h-4 w-4" />
                  Novo gasto
                </Link>
              </Button>
            ) : null
          }
          className="items-start text-left"
        />
      ) : (
        <ExpenseListClient
          expenses={expenses}
          members={members}
          categories={categories}
          bankAccounts={bankAccounts}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </section>
  );
}
