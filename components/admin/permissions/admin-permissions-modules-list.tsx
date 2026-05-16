type AdminPermissionModule = {
  readonly key: string;
  readonly label: string;
};

interface AdminPermissionsModulesListProps {
  modules: readonly AdminPermissionModule[];
}

export function AdminPermissionsModulesList({ modules }: AdminPermissionsModulesListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Módulos controláveis</p>
        <p className="text-xs font-semibold text-[#8b72f8]">{modules.length}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {modules.map((module) => (
          <div key={module.key} className="rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
            <p className="text-sm font-semibold text-white">{module.label}</p>
            <p className="mt-1 text-xs text-white/35">{module.key}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
