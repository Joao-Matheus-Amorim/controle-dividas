import { Badge } from "@/components/ui/badge";

type AdminModule = {
  readonly key: string;
  readonly label: string;
};

interface AdminModuleBadgesProps {
  modules: readonly AdminModule[];
}

export function AdminModuleBadges({ modules }: AdminModuleBadgesProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Módulos controláveis</p>
        <p className="text-xs font-semibold text-[#8b72f8]">{modules.length}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {modules.map((module) => (
          <Badge key={module.key} variant="secondary" className="bg-white/10 text-white/65">
            {module.label}
          </Badge>
        ))}
      </div>
    </section>
  );
}
