"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FamilyMemberFormState } from "@/lib/finance/server";
import { createFamilyMember } from "@/app/protected/pessoas/actions";

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

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar pessoa"}
      </Button>
    </form>
  );
}
