type AdminProfile = {
  name: string;
  email: string | null;
};

interface AdminHeroSummaryProps {
  adminProfile: AdminProfile;
  familyUserCount: number;
  permissionCount: number;
}

export function AdminHeroSummary({ adminProfile, familyUserCount, permissionCount }: AdminHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-[linear-gradient(135deg,#2a1f1a_0%,#1a1613_55%,#14110F_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Perfil Admin</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{adminProfile.name}</p>
        <p className="mt-2 text-sm text-muted-foreground">{adminProfile.email || "Email não informado"}</p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-border">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ff-subtle-foreground">Usuários</p>
            <p className="mt-1 text-sm font-semibold text-primary">{familyUserCount} familiar(es)</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ff-subtle-foreground">Permissões</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{permissionCount} regra(s)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
