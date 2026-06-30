import { Badge } from "@/components/ui/badge";
import type { DbFamilyMember } from "@/lib/finance/types";
import { SettingsMemberLimitForm } from "./settings-member-limit-form";
import { compactCurrencyForCode } from "./settings-utils";

interface SettingsMemberLimitsProps {
  members: DbFamilyMember[];
  canManagePeople?: boolean;
}

export function SettingsMemberLimits({
  members,
  canManagePeople = false,
}: SettingsMemberLimitsProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Limites mensais</p>
        <p className="text-xs font-semibold text-primary">{members.length}</p>
      </div>
      {members.map((member) => (
        <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{member.name}</p>
              <Badge variant={member.is_active ? "secondary" : "outline"}>{member.is_active ? "Ativo" : "Inativo"}</Badge>
            </div>
            <p className="mt-1 text-xs text-ff-subtle-foreground">
              Limite atual: {compactCurrencyForCode(Number(member.monthly_limit), String(member.currency ?? "EUR"))}
            </p>
          </div>

          {canManagePeople ? (
            <SettingsMemberLimitForm member={member} />
          ) : null}
        </div>
      ))}
    </section>
  );
}
