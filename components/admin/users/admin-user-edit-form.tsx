"use client";

import { useActionState } from "react";

import { updateFamilyUserWithState } from "@/app/protected/admin/action-state";
import type { FamilyUserActionState } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbProfile } from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";

const initialState: FamilyUserActionState = {};

interface AdminUserEditFormProps {
  profile: DbProfile;
  members: DbFamilyMember[];
}

export function AdminUserEditForm({ profile, members }: AdminUserEditFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateFamilyUserWithState,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3 md:grid-cols-4">
      <input type="hidden" name="id" value={profile.id} />
      <Input name="name" defaultValue={profile.name} placeholder="Nome" className="h-10 rounded-xl" required />
      <Input name="email" type="email" defaultValue={profile.email || ""} placeholder="Email" className="h-10 rounded-xl" required />
      <select name="linked_family_member_id" defaultValue={profile.linked_family_member_id || ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground">
        <option value="">Selecione o membro</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>{member.name}</option>
        ))}
      </select>
      <Button type="submit" disabled={isPending} className="h-10 rounded-xl bg-primary text-foreground hover:bg-ff-primary-hover">
        {isPending ? "Salvando..." : "Salvar"}
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="md:col-span-4" />
    </form>
  );
}
