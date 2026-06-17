import { FinanceCreateCard } from "@/components/finance/finance-create-card";
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import type { DbBankAccount, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

interface ExpenseCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts: DbBankAccount[];
  orgSlug?: string;
}

export function ExpenseCreateSection({
  canCreate,
  members,
  categories,
  bankAccounts,
  orgSlug,
}: ExpenseCreateSectionProps) {
  if (!canCreate) return null;

  const defaultMemberId = members.length === 1 ? members[0]?.id : undefined;

  return (
    <FinanceCreateCard
      eyebrow="Novo gasto"
      title="Pessoa obrigatoria para gastos"
      description="Registre um lancamento financeiro sem sair do fluxo principal."
      memberCount={members.length}
      peopleHref={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
    >
      <ExpenseFormDialog
        members={members}
        categories={categories}
        bankAccounts={bankAccounts}
        defaultMemberId={defaultMemberId}
      />
    </FinanceCreateCard>
  );
}
