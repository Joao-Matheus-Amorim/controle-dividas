"use client";

import { useActionState } from "react";

import { updateOrganizationDisplayCurrency } from "@/app/protected/configuracoes/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { financeFieldClass, financeFormClass, financeNativeSelectClass, financeSubmitBarClass, financeSubmitButtonClass } from "@/components/finance/finance-form-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { systemCurrencyOptions } from "@/lib/finance/bank-options";

type SettingsOrganizationCurrencyProps = {
  currentCurrency: string;
  canManageCurrency: boolean;
};

const initialState: { error?: string; success?: string } = {};

export function SettingsOrganizationCurrency({
  currentCurrency,
  canManageCurrency,
}: SettingsOrganizationCurrencyProps) {
  const [state, formAction, isPending] = useActionState(updateOrganizationDisplayCurrency, initialState);

  return (
    <AppCard className="space-y-4">
      <div>
        <AppSectionTitle>Moeda padrao da visualizacao</AppSectionTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Define em qual moeda os resumos do dashboard e das configuracoes devem aparecer.
        </p>
      </div>

      <form action={formAction} className={financeFormClass}>
        <div className={financeFieldClass}>
          <Label htmlFor="display_currency">Moeda principal</Label>
          <select
            id="display_currency"
            name="display_currency"
            defaultValue={currentCurrency}
            disabled={!canManageCurrency}
            className={financeNativeSelectClass}
          >
            {systemCurrencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div className={financeSubmitBarClass}>
          <AppActionFeedback error={state.error} success={state.success} />
          {canManageCurrency ? (
            <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
              {isPending ? "Salvando..." : "Salvar moeda"}
            </Button>
          ) : null}
        </div>
      </form>
    </AppCard>
  );
}
