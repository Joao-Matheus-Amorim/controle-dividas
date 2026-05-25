import { PermissionsForm } from "@/components/finance/permissions-form";
import { FeaturePermissionsForm } from "@/components/finance/feature-permissions-form";
import type { DbFeaturePermission, DbModulePermission, DbProfile } from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";

interface AdminPermissionsFormSectionProps {
  profiles: DbProfile[];
  permissions: DbModulePermission[];
  featurePermissions: DbFeaturePermission[];
  members: DbFamilyMember[];
}

export function AdminPermissionsFormSection({
  profiles,
  permissions,
  featurePermissions,
  members,
}: AdminPermissionsFormSectionProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Configurar permissões</p>
          <p className="text-xs font-semibold text-[#8b72f8]">ações · escopo · pessoas</p>
        </div>
        <PermissionsForm profiles={profiles} permissions={permissions} members={members} />
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Configurar funcionalidades</p>
          <p className="text-xs font-semibold text-[#8b72f8]">features · planos · acesso fino</p>
        </div>
        <FeaturePermissionsForm profiles={profiles} featurePermissions={featurePermissions} />
      </section>
    </div>
  );
}
