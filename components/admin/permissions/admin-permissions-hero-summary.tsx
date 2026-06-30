interface AdminPermissionsHeroSummaryProps {
  permissionCount: number;
  familyUserCount: number;
  configuredProfileCount: number;
}

export function AdminPermissionsHeroSummary({
  permissionCount,
  familyUserCount,
  configuredProfileCount,
}: AdminPermissionsHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-[linear-gradient(135deg,#2a1f1a_0%,#1a1613_55%,#14110F_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Controle de acesso</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{permissionCount}</p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-border">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ff-subtle-foreground">Usuários</p>
            <p className="mt-1 text-sm font-semibold text-primary">{familyUserCount} configurável(is)</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ff-subtle-foreground">Perfis</p>
            <p className="mt-1 text-sm font-semibold text-ff-success">{configuredProfileCount} com regras</p>
          </div>
        </div>
      </div>
    </section>
  );
}
