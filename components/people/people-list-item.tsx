import { Badge } from "@/components/ui/badge";
import type { DbFamilyMember } from "@/lib/finance/types";
import { PeopleDeleteForm } from "./people-delete-form";
import { PeopleEditForm } from "./people-edit-form";
import { PeopleStatusForm } from "./people-status-form";
import { compactCurrency, initials, type AccessProfileSummary } from "./people-utils";

interface PeopleListItemProps {
  member: DbFamilyMember;
  access?: AccessProfileSummary;
  canManagePeople?: boolean;
}

export function PeopleListItem({
  member,
  access,
  canManagePeople = false,
}: PeopleListItemProps) {
  const hasLogin = Boolean(access?.auth_user_id);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background/50 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {initials(member.name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
              <Badge variant={member.is_active ? "secondary" : "outline"}>
                {member.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <Badge variant={access ? "outline" : "destructive"} className={access ? "border-border text-muted-foreground" : ""}>
                {access ? (hasLogin ? "Login ativo" : "Aguardando primeiro acesso") : "Sem acesso"}
              </Badge>
            </div>
            <p className="mt-1 truncate text-xs text-ff-subtle-foreground">
              {member.role || "Sem perfil informado"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-ff-success">
              Limite: {compactCurrency(Number(member.monthly_limit))}
            </p>
            <p className="mt-0.5 truncate text-xs text-ff-subtle-foreground">
              Acesso: {access?.email || "não criado"}
            </p>
          </div>
        </div>

        {canManagePeople ? <PeopleStatusForm memberId={member.id} isActive={member.is_active} /> : null}
      </div>

      {canManagePeople ? (
        <details className="rounded-2xl border border-border bg-ff-bg-soft p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Editar pessoa
          </summary>
          <PeopleEditForm member={member} />
          <PeopleDeleteForm member={member} />
        </details>
      ) : null}
    </div>
  );
}
