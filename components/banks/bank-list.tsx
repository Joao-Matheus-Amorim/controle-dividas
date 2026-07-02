import Link from "next/link";
import { Landmark, PlusCircle } from "lucide-react";

import { AppEmptyState } from "@/components/app/app-empty-state";
import { BankAccountFormDialog } from "@/components/finance/bank-account-form-dialog";
import { Button } from "@/components/ui/button";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { BankListItem } from "./bank-list-item";
import { compactCurrencyForCode, initials } from "./bank-utils";

interface BankListProps {
  accounts: DbBankAccount[];
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

export function BankList({ accounts, members, canEdit, canDelete, canCreate }: BankListProps) {
  const accountsByMember = members
    .map((member) => ({
      member,
      accounts: accounts.filter((account) => account.family_member_id === member.id),
    }))
    .filter(({ accounts }) => accounts.length > 0 || canCreate);

  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Bancos por pessoa</p>
        <p className="text-xs font-semibold text-primary">{accounts.length}</p>
      </div>

      {accounts.length === 0 ? (
        <AppEmptyState
          icon={Landmark}
          title="Nenhum banco cadastrado"
          description="Adicione uma conta, cartao ou saldo em dinheiro para conectar movimentacoes ao lugar certo."
          action={
            canCreate ? (
              <Button asChild size="sm" className="h-10 w-full rounded-2xl bg-primary px-4 font-bold text-foreground hover:bg-ff-primary-hover sm:w-auto">
                <Link href="#novo-banco">
                  <PlusCircle className="h-4 w-4" />
                  Novo banco
                </Link>
              </Button>
            ) : null
          }
          className="items-start text-left"
        />
      ) : (
        accountsByMember.map(({ member, accounts }) => {
          const memberTotalByCurrency = accounts.reduce((totals, account) => {
            const currency = String(account.currency ?? "EUR").trim().toUpperCase() || "EUR";
            totals.set(currency, (totals.get(currency) ?? 0) + Number(account.current_balance));
            return totals;
          }, new Map<string, number>());

          const memberTotalLabel = Array.from(memberTotalByCurrency.entries())
            .map(([currency, total]) => compactCurrencyForCode(total, currency))
            .join(" + ") || compactCurrencyForCode(0, member.currency);

          return (
            <div key={member.id} className="space-y-3 rounded-2xl border border-border bg-background/50 p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ff-primary-soft text-xs font-bold text-primary">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs text-ff-subtle-foreground">
                      {accounts.length} banco(s) - {memberTotalLabel}
                    </p>
                  </div>
                </div>

                {canCreate ? (
                  <BankAccountFormDialog
                    members={[member]}
                    defaultMemberId={member.id}
                    triggerLabel="+ banco"
                  />
                ) : null}
              </div>

              {accounts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-ff-bg-soft px-3 py-4 text-sm text-muted-foreground">
                  Nenhum banco cadastrado para esta pessoa.
                </p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <BankListItem
                      key={account.id}
                      account={account}
                      members={members}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
