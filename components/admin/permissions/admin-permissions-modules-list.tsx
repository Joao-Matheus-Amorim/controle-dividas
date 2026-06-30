type AdminPermissionModule = {
  readonly key: string;
  readonly label: string;
};

interface AdminPermissionsModulesListProps {
  modules: readonly AdminPermissionModule[];
}

export function AdminPermissionsModulesList({ modules }: AdminPermissionsModulesListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Módulos controláveis</p>
        <p className="text-xs font-semibold text-primary">{modules.length}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {modules.map((module) => (
          <div key={module.key} className="rounded-2xl border border-border bg-background/50 p-3">
            <p className="text-sm font-semibold text-foreground">{module.label}</p>
            <p className="mt-1 text-xs text-ff-subtle-foreground">{module.key}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
