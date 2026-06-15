import { BankAccountFormDialog } from "@/components/finance/bank-account-form-dialog";
import { FinanceCreateCard } from "@/components/finance/finance-create-card";
import type { DbFamilyMember } from "@/lib/finance/types";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

interface BankCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
  orgSlug?: string;
}

export function BankCreateSection({
  canCreate,
  members,
  orgSlug,
}: BankCreateSectionProps) {
  if (!canCreate) return null;

  const defaultMemberId = members.length === 1 ? members[0]?.id : undefined;

  return (
    <FinanceCreateCard
      eyebrow="Novo banco"
      title="Pessoa obrigatoria para bancos"
      description="Cadastre contas, cartoes e saldos vinculados ao escopo da familia."
      memberCount={members.length}
      peopleHref={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
    >
      <BankAccountFormDialog members={members} defaultMemberId={defaultMemberId} />
    </FinanceCreateCard>
  );
}
