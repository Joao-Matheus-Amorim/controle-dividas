import { Building2 } from "lucide-react";

type ActiveOrganizationIndicatorProps = {
  organization:
    | {
        name: string;
        slug: string;
      }
    | null;
};

export function ActiveOrganizationIndicator({
  organization,
}: ActiveOrganizationIndicatorProps) {
  if (!organization) {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-100">
        <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden text-amber-100/70 sm:inline">Organização</span>
        <span className="max-w-40 truncate">não selecionada</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80">
      <Building2 className="h-3.5 w-3.5 shrink-0 text-[#b09cff]" aria-hidden="true" />
      <span className="hidden text-white/45 sm:inline">Organização</span>
      <span className="max-w-44 truncate text-white" title={organization.name}>
        {organization.name}
      </span>
      <span className="hidden max-w-32 truncate rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/40 md:inline">
        {organization.slug}
      </span>
    </div>
  );
}
