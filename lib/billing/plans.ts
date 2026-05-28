export const BILLING_PLAN_KEYS = [
  "free",
  "family_basic",
  "family_plus",
  "family_pro",
] as const;

export type BillingPlanKey = (typeof BILLING_PLAN_KEYS)[number];

export type BillingPlan = {
  key: BillingPlanKey;
  name: string;
  description: string;
  isPaid: boolean;
};

export const BILLING_PLANS: Record<BillingPlanKey, BillingPlan> = {
  free: {
    key: "free",
    name: "Free",
    description: "Plano inicial para validacao de uma organizacao.",
    isPaid: false,
  },
  family_basic: {
    key: "family_basic",
    name: "Family Basic",
    description: "Plano pago de entrada para uma organizacao familiar.",
    isPaid: true,
  },
  family_plus: {
    key: "family_plus",
    name: "Family Plus",
    description: "Plano pago intermediario para uma organizacao familiar.",
    isPaid: true,
  },
  family_pro: {
    key: "family_pro",
    name: "Family Pro",
    description: "Plano pago avancado para uma organizacao familiar.",
    isPaid: true,
  },
};

const billingPlanKeySet = new Set<string>(BILLING_PLAN_KEYS);

export function isBillingPlanKey(value: string): value is BillingPlanKey {
  return billingPlanKeySet.has(value);
}

export function normalizeBillingPlanKey(value: string | null | undefined): BillingPlanKey {
  return value && isBillingPlanKey(value) ? value : "free";
}

export function getBillingPlan(value: string | null | undefined): BillingPlan {
  return BILLING_PLANS[normalizeBillingPlanKey(value)];
}

export function isPaidBillingPlan(value: string | null | undefined) {
  return getBillingPlan(value).isPaid;
}
