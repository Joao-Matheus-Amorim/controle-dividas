"use client";

import { useActionState } from "react";

import { createFamilyMember } from "@/app/protected/pessoas/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FamilyMemberFormState } from "@/lib/finance/types";

const initialState: FamilyMemberFormState = {};

export function FamilyMemberForm() {
  const [state, formAction, isPending] = useActionState(
    createFamilyMember,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" placeholder="Ex: Danyel" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Perfil</Label>
          <Input id="role" name="role" placeholder="Ex: Responsavel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_limit">Limite mensal em euro</Label>
          <Input
            id="monthly_limit"
            name="monthly_limit"
            type="number"
            min="0"
            step="0.01"
            placeholder="150.00"
            required
          />
        </div>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar pessoa"}
      </Button>
    </form>
  );
}
