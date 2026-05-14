import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppHeroTone = "primary" | "danger" | "success" | "warning";

const toneClasses: Record<AppHeroTone, string> = {
  primary: "border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_52%,#080520_100%)] before:bg-[#8b72f8]/10",
  danger: "border-[#f0506e]/20 bg-[linear-gradient(135deg,#2b0f22_0%,#140814_55%,#080810_100%)] before:bg-[#f0506e]/10",
  success: "border-[#1de9b2]/20 bg-[linear-gradient(135deg,#05332b_0%,#081816_52%,#080810_100%)] before:bg-[#1de9b2]/10",
  warning: "border-[#f7b84b]/20 bg-[linear-gradient(135deg,#36240a_0%,#171006_52%,#080810_100%)] before:bg-[#f7b84b]/10",
};

interface AppHeroCardProps {
  eyebrow: string;
  value: string;
  children?: ReactNode;
  tone?: AppHeroTone;
  className?: string;
}

export function AppHeroCard({
  eyebrow,
  value,
  children,
  tone = "primary",
  className,
}: AppHeroCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border p-5 shadow-2xl shadow-black/30 before:pointer-events-none before:absolute before:-right-16 before:-top-16 before:h-48 before:w-48 before:rounded-full before:blur-2xl",
        toneClasses[tone],
        className,
      )}
    >
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
          {eyebrow}
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {value}
        </p>
        {children}
      </div>
    </section>
  );
}

export function AppHeroSplit({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; className?: string }>;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
      {items.map((item, index) => (
        <div key={item.label} className={cn(index === 0 ? "pr-4" : "pl-4", item.className)}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            {item.label}
          </p>
          <div className="mt-1 text-sm font-semibold text-white/85">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
