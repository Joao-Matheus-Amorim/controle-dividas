"use client";

import { useActionState } from "react";

import {
  updateFamilyMemberWithState,
  type FamilyMemberActionState,
} from "@/app/protected/pessoas/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbFamilyMember } from "@/lib/finance/types";

const initialState: FamilyMemberActionState = {};

export function PeopleEditForm({ member }: { member: DbFamilyMember }) {
  const [state, formAction, isPending] = useActionState(
    updateFamilyMemberWithState,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3 md:grid-cols-4">
      <input type="hidden" name="id" value={member.id} />
      <Input name="name" defaultValue={member.name} placeholder="Nome" className="h-10 rounded-xl" required />
      <Input name="role" defaultValue={member.role || ""} placeholder="Perfil familiar" className="h-10 rounded-xl" />
      <Input
        name="monthly_limit"
        type="number"
        step="0.01"
        min="0"
        defaultValue={Number(member.monthly_limit)}
        placeholder="Limite"
        className="h-10 rounded-xl"
        required
      />
      <Button type="submit" disabled={isPending} className="h-10 rounded-xl bg-primary text-foreground hover:bg-ff-primary-hover">
        {isPending ? "Salvando..." : "Salvar"}
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="md:col-span-4" />
    </form>
  );
}
