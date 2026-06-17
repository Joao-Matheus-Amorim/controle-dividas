import { FinanceCreateCard } from "@/components/finance/finance-create-card";
import { ReceivableIncomeFormDialog } from "@/components/finance/receivable-income-form-dialog";
import type { DbFamilyMember } from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

interface ReceivableCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
  orgSlug?: string;
}

export function ReceivableCreateSection({
  canCreate,
  members,
  orgSlug,
}: ReceivableCreateSectionProps) {
  if (!canCreate) return null;

  const defaultMemberId = members.length === 1 ? members[0]?.id : undefined;

  return (
    <FinanceCreateCard
      id="novo-recebimento"
      eyebrow="Entrada de dinheiro"
      title="Pessoa obrigatória para recebimentos"
      description="Cadastre salário, comissão, renda fixa, venda ou recebimento pontual."
      memberCount={members.length}
      peopleHref={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
    >
      <ReceivableIncomeFormDialog members={members} defaultMemberId={defaultMemberId} />
    </FinanceCreateCard>
  );
}
