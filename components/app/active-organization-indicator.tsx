import { Building2 } from "lucide-react";

import { setActiveOrganization } from "@/app/protected/organization-switcher-actions";
import type { Organization } from "@/lib/organizations/types";

type ActiveOrganizationIndicatorProps = {
  organization: Organization | null;
  organizationOptions: Organization[];
};

export function ActiveOrganizationIndicator({
  organization,
  organizationOptions,
}: ActiveOrganizationIndicatorProps) {
  const hasMultipleOrganizations = organizationOptions.length > 1;

  if (!organization) {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-100">
        <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden text-amber-100/70 sm:inline">Organizacao</span>
        <span className="max-w-40 truncate">Nao selecionada</span>
      </div>
    );
  }

  if (!hasMultipleOrganizations) {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#b09cff]" aria-hidden="true" />
        <span className="hidden text-white/45 sm:inline">Organizacao</span>
        <span className="max-w-44 truncate text-white" title={organization.name}>
          {organization.name}
        </span>
        <span className="hidden max-w-32 truncate rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/40 md:inline">
          {organization.slug}
        </span>
      </div>
    );
  }

  return (
    <form action={setActiveOrganization} className="flex min-w-0 items-center gap-2">
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#b09cff]" aria-hidden="true" />
        <span className="hidden text-white/45 sm:inline">Organizacao</span>
      </div>
      <select
        name="organization_id"
        defaultValue={organization.id}
        className="h-8 min-w-0 max-w-56 rounded-full border border-white/10 bg-[#121225] px-3 text-xs text-white outline-none"
      >
        {organizationOptions.map((organizationOption) => (
          <option
            key={organizationOption.id}
            value={organizationOption.id}
            className="bg-[#121225] text-white"
          >
            {organizationOption.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-8 rounded-full border border-white/10 px-3 text-xs font-semibold text-[#b09cff] transition hover:bg-white/[0.06]"
      >
        Trocar
      </button>
    </form>
  );
}
