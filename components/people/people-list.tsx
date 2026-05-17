import type { DbFamilyMember } from "@/lib/finance/types";
import { PeopleListItem } from "./people-list-item";
import type { AccessProfileSummary } from "./people-utils";

interface PeopleListProps {
  members: DbFamilyMember[];
  profiles: Map<string, AccessProfileSummary>;
}

export function PeopleList({ members, profiles }: PeopleListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Membros cadastrados</p>
        <p className="text-xs font-semibold text-[#8b72f8]">{members.length}</p>
      </div>

      {members.map((member) => (
        <PeopleListItem key={member.id} member={member} access={profiles.get(member.id)} />
      ))}
    </section>
  );
}
