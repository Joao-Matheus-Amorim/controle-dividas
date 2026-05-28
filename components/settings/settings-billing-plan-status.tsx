import { CreditCard, ShieldCheck } from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { getBillingPlan, type BillingPlanKey } from "@/lib/billing/plans";

interface SettingsBillingPlanStatusProps {
  organizationName: string;
  plan: BillingPlanKey;
  status: string;
  trialEndsAt: string | null;
}

function formatTrialEndsAt(value: string | null) {
  if (!value) {
    return "Sem trial ativo";
  }

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  return date.toLocaleDateString("pt-BR");
}

export function SettingsBillingPlanStatus({
  organizationName,
  plan,
  status,
  trialEndsAt,
}: SettingsBillingPlanStatusProps) {
  const billingPlan = getBillingPlan(plan);

  return (
    <AppCard className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <AppSectionTitle>Plano da organizacao</AppSectionTitle>
          <h2 className="mt-2 text-xl font-black tracking-[-0.035em] text-white">
            {billingPlan.name}
          </h2>
          <p className="mt-1 text-sm leading-6 text-white/40">
            {billingPlan.description}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#8b72f8]/10 text-[#b09cff]">
          <CreditCard className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#080810]/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
            Organizacao
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">{organizationName}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#080810]/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
            Status
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">{status}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#080810]/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
            Trial
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">
            {formatTrialEndsAt(trialEndsAt)}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#1de9b2]/15 bg-[#1de9b2]/10 p-3 text-sm text-[#1de9b2]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Billing comercial ainda nao esta ativo. Este bloco mostra o contrato local de planos antes da integracao comercial.
        </p>
      </div>
    </AppCard>
  );
}
