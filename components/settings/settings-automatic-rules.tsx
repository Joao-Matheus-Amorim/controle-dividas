import { automaticRules } from "./settings-utils";

export function SettingsAutomaticRules() {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Regras automáticas</p>
      {automaticRules.map((rule) => (
        <div key={rule} className="rounded-2xl border border-border bg-background/50 p-3 text-sm text-muted-foreground">
          {rule}
        </div>
      ))}
    </section>
  );
}
