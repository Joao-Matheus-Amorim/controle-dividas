import { FinanceCreateCard } from "@/components/finance/finance-create-card";
import { PayableBillFormDialog } from "@/components/finance/payable-bill-form-dialog";
import type { DbFamilyMember } from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

interface PayableCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
  orgSlug?: string;
}

export function PayableCreateSection({
  canCreate,
  members,
  orgSlug,
}: PayableCreateSectionProps) {
  if (!canCreate) return null;

  const defaultMemberId = members.length === 1 ? members[0]?.id : undefined;

  return (
    <FinanceCreateCard
      eyebrow="Nova conta"
      title="Pessoa obrigatoria para contas"
      description="Cadastre uma conta avulsa ou fixa e acompanhe vencimentos."
      memberCount={members.length}
      peopleHref={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
    >
      <PayableBillFormDialog members={members} defaultMemberId={defaultMemberId} />
    </FinanceCreateCard>
  );
}
