import { CreditCard, ShieldCheck } from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { Button } from "@/components/ui/button";
import {
  startBillingCheckout,
  startBillingPortal,
} from "@/app/protected/configuracoes/billing-actions";
import {
  BILLING_PLANS,
  getBillingPlan,
  type BillingPlanKey,
} from "@/lib/billing/plans";

interface SettingsBillingPlanStatusProps {
  organizationName: string;
  plan: BillingPlanKey;
  status: string;
  trialEndsAt: string | null;
  canManageBilling: boolean;
  checkoutEnabled: boolean;
  checkoutReady: boolean;
  checkoutStatus?: string;
  portalStatus?: string;
  hasStripeCustomer: boolean;
  orgSlug?: string;
}

function formatTrialEndsAt(value: string | null) {
  if (!value) {
    return "Sem trial ativo";
  }

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  return date.toLocaleDateString("pt-BR");
}

function getCheckoutStatusMessage(status: string | undefined) {
  switch (status) {
    case "success":
      return "Checkout iniciado. O plano local permanece ate a confirmacao da assinatura.";
    case "cancelled":
      return "Checkout cancelado. Nenhuma alteracao local foi aplicada.";
    case "checkout_disabled":
      return "Checkout Stripe esta desativado por configuracao.";
    case "stripe_not_configured":
      return "Checkout Stripe esta habilitado, mas a configuracao server-side esta incompleta.";
    case "missing_price":
      return "Checkout Stripe esta sem price id configurado para o plano escolhido.";
    case "invalid_plan":
      return "Plano selecionado nao possui checkout.";
    case "missing_checkout_url":
      return "Stripe nao retornou URL de checkout.";
    default:
      return null;
  }
}

function getPortalStatusMessage(status: string | undefined) {
  switch (status) {
    case "returned":
      return "Portal de billing encerrado. Alteracoes de assinatura dependem do webhook.";
    case "portal_disabled":
      return "Portal de billing esta desativado por configuracao.";
    case "stripe_not_configured":
      return "Portal de billing esta habilitado, mas a configuracao server-side esta incompleta.";
    case "missing_customer":
      return "Portal de billing indisponivel ate a organizacao ter um customer Stripe.";
    case "missing_portal_url":
      return "Stripe nao retornou URL de portal.";
    case "rate_limited":
      return "Muitas tentativas de abertura do portal. Tente novamente em alguns minutos.";
    default:
      return null;
  }
}

export function SettingsBillingPlanStatus({
  organizationName,
  plan,
  status,
  trialEndsAt,
  canManageBilling,
  checkoutEnabled,
  checkoutReady,
  checkoutStatus,
  portalStatus,
  hasStripeCustomer,
  orgSlug,
}: SettingsBillingPlanStatusProps) {
  const billingPlan = getBillingPlan(plan);
  const paidPlans = [
    BILLING_PLANS.family_basic,
    BILLING_PLANS.family_plus,
    BILLING_PLANS.family_pro,
  ];
  const checkoutAvailable = canManageBilling && checkoutEnabled && checkoutReady;
  const checkoutStatusMessage = getCheckoutStatusMessage(checkoutStatus);
  const portalStatusMessage = getPortalStatusMessage(portalStatus);
  const portalAvailable = checkoutAvailable && hasStripeCustomer;
  const portalAction = startBillingPortal.bind(null, orgSlug);

  return (
    <AppCard className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <AppSectionTitle>Plano da organizacao</AppSectionTitle>
          <h2 className="mt-2 text-xl font-black tracking-[-0.035em] text-foreground">
            {billingPlan.name}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {billingPlan.description}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ff-subtle-foreground">
            Organizacao
          </p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">{organizationName}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ff-subtle-foreground">
            Status
          </p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">{status}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ff-subtle-foreground">
            Trial
          </p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">
            {formatTrialEndsAt(trialEndsAt)}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-ff-success/30 bg-ff-success-soft p-3 text-sm text-ff-success">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          A assinatura e concluida no ambiente de pagamento. O plano local permanece ate a confirmacao.
        </p>
      </div>

      {checkoutStatusMessage ? (
        <div className="rounded-2xl border border-border bg-background/55 p-3 text-sm text-foreground">
          {checkoutStatusMessage}
        </div>
      ) : null}

      {portalStatusMessage ? (
        <div className="rounded-2xl border border-border bg-background/55 p-3 text-sm text-foreground">
          {portalStatusMessage}
        </div>
      ) : null}

      <form
        action={portalAction}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-background/55 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-bold text-foreground">Portal de billing</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Gerencie metodo de pagamento e assinatura no Stripe.
          </p>
        </div>
        <Button disabled={!portalAvailable} type="submit">
          <CreditCard className="h-4 w-4" />
          Abrir portal
        </Button>
      </form>

      <div className="grid gap-3 lg:grid-cols-3">
        {paidPlans.map((paidPlan) => {
          const formAction = startBillingCheckout.bind(null, paidPlan.key, orgSlug);

          return (
            <form
              action={formAction}
              className="flex min-h-36 flex-col justify-between rounded-2xl border border-border bg-background/55 p-3"
              key={paidPlan.key}
            >
              <div>
                <p className="text-sm font-bold text-foreground">{paidPlan.name}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {paidPlan.description}
                </p>
              </div>
              <Button
                className="mt-4 w-full"
                disabled={!checkoutAvailable || paidPlan.key === plan}
                type="submit"
              >
                <CreditCard className="h-4 w-4" />
                {paidPlan.key === plan ? "Plano atual" : "Iniciar checkout"}
              </Button>
            </form>
          );
        })}
      </div>

      {!checkoutEnabled ? (
        <p className="text-sm text-muted-foreground">
          Checkout indisponivel neste ambiente. O app continua funcionando normalmente.
        </p>
      ) : null}

      {!canManageBilling ? (
        <p className="text-sm text-muted-foreground">
          Apenas owner/admin da organizacao pode iniciar checkout.
        </p>
      ) : null}

      {checkoutEnabled && !checkoutReady ? (
        <p className="text-sm text-muted-foreground">
          Checkout indisponivel por configuracao incompleta.
        </p>
      ) : null}

      {checkoutEnabled && checkoutReady && canManageBilling && !hasStripeCustomer ? (
        <p className="text-sm text-muted-foreground">
          Portal indisponivel ate a organizacao ter um customer Stripe.
        </p>
      ) : null}
    </AppCard>
  );
}
