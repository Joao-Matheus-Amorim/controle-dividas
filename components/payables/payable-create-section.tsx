import { FinanceCreateCard } from "@/components/finance/finance-create-card";
import { PayableBillFormDialog } from "@/components/finance/payable-bill-form-dialog";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

interface PayableCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
  bankAccounts: DbBankAccount[];
  orgSlug?: string;
}

export function PayableCreateSection({
  canCreate,
  members,
  bankAccounts,
  orgSlug,
}: PayableCreateSectionProps) {
  if (!canCreate) return null;

  const defaultMemberId = members.length === 1 ? members[0]?.id : undefined;

  return (
    <FinanceCreateCard
      id="nova-conta"
      eyebrow="Nova conta"
      title="Pessoa obrigatoria para contas"
      description="Cadastre uma conta avulsa ou fixa e acompanhe vencimentos."
      memberCount={members.length}
      peopleHref={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
    >
      <PayableBillFormDialog members={members} bankAccounts={bankAccounts} defaultMemberId={defaultMemberId} />
    </FinanceCreateCard>
  );
}
