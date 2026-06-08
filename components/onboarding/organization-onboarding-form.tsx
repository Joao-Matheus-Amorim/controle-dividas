"use client";

import { useActionState } from "react";

import {
  createInitialOrganizationFromOnboarding,
  type InitialOrganizationOnboardingState,
} from "@/app/onboarding/organizacao/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InitialOrganizationOnboardingState = {};

export function OrganizationOnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    createInitialOrganizationFromOnboarding,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organization_name">Nome do espaco financeiro</Label>
        <Input id="organization_name" name="organization_name" placeholder="Ex: Familia Amorim" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_slug">Identificador do link</Label>
        <Input id="organization_slug" name="organization_slug" placeholder="familia-amorim" />
        <p className="text-xs leading-5 text-white/35">
          Use letras minusculas, numeros e hifens. Se ficar vazio, sera sugerido a partir do nome.
        </p>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending} className="w-full rounded-2xl bg-[#8b72f8] font-bold text-white hover:bg-[#7d66e4]">
        {isPending ? "Processando..." : "Continuar"}
      </Button>
    </form>
  );
}
