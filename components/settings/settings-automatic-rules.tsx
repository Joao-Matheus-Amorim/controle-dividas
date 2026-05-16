import { automaticRules } from "./settings-utils";

export function SettingsAutomaticRules() {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Regras automáticas</p>
      {automaticRules.map((rule) => (
        <div key={rule} className="rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
          {rule}
        </div>
      ))}
    </section>
  );
}
