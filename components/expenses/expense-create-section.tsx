import { FinanceCreateCard } from "@/components/finance/finance-create-card";
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import type { DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

interface ExpenseCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  orgSlug?: string;
}

export function ExpenseCreateSection({
  canCreate,
  members,
  categories,
  orgSlug,
}: ExpenseCreateSectionProps) {
  if (!canCreate) return null;

  return (
    <FinanceCreateCard
      eyebrow="Novo gasto"
      title="Pessoa obrigatoria para gastos"
      description="Registre um lancamento financeiro sem sair do fluxo principal."
      memberCount={members.length}
      peopleHref={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
    >
      <ExpenseFormDialog members={members} categories={categories} />
    </FinanceCreateCard>
  );
}
