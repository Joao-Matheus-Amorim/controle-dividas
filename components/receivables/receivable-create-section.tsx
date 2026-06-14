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

  return (
    <FinanceCreateCard
      eyebrow="Novo recebimento"
      title="Pessoa obrigatoria para recebimentos"
      description="Cadastre entradas previstas, rendas fixas ou recebimentos pontuais."
      memberCount={members.length}
      peopleHref={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
    >
      <ReceivableIncomeFormDialog members={members} />
    </FinanceCreateCard>
  );
}
