"use client";

import { useActionState } from "react";

import {
  validateInitialOrganizationOnboarding,
  type InitialOrganizationOnboardingState,
} from "@/app/onboarding/organizacao/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InitialOrganizationOnboardingState = {};

export function OrganizationOnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    validateInitialOrganizationOnboarding,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organization_name">Nome da organização</Label>
        <Input id="organization_name" name="organization_name" placeholder="Ex: Família Amorim" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_slug">Slug</Label>
        <Input id="organization_slug" name="organization_slug" placeholder="familia-amorim" />
        <p className="text-xs leading-5 text-white/35">
          Use letras minúsculas, números e hífens. Se ficar vazio, será sugerido a partir do nome.
        </p>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending} className="w-full rounded-2xl bg-[#8b72f8] font-bold text-white hover:bg-[#7d66e4]">
        {isPending ? "Validando..." : "Validar dados"}
      </Button>
    </form>
  );
}
