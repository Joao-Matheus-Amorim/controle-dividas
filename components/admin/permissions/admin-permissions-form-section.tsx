import { PermissionsForm } from "@/components/finance/permissions-form";
import type { DbModulePermission, DbProfile } from "@/lib/finance/admin-server";
import type { DbFamilyMember } from "@/lib/finance/server";

interface AdminPermissionsFormSectionProps {
  profiles: DbProfile[];
  permissions: DbModulePermission[];
  members: DbFamilyMember[];
}

export function AdminPermissionsFormSection({
  profiles,
  permissions,
  members,
}: AdminPermissionsFormSectionProps) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Configurar permissões</p>
        <p className="text-xs font-semibold text-[#8b72f8]">ações · escopo · pessoas</p>
      </div>
      <PermissionsForm profiles={profiles} permissions={permissions} members={members} />
    </section>
  );
}
