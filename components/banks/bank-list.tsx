import Link from "next/link";
import { Landmark, PlusCircle } from "lucide-react";

import { AppEmptyState } from "@/components/app/app-empty-state";
import { Button } from "@/components/ui/button";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { BankListItem } from "./bank-list-item";

interface BankListProps {
  accounts: DbBankAccount[];
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

export function BankList({ accounts, members, canEdit, canDelete, canCreate }: BankListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Bancos cadastrados</p>
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
        accounts.map((account) => (
          <BankListItem
            key={account.id}
            account={account}
            members={members}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))
      )}
    </section>
  );
}
