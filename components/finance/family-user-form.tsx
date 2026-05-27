"use client";

import { useActionState } from "react";

import { createFamilyUser } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DbFamilyMember } from "@/lib/finance/types";
import type { ProfileFormState } from "@/lib/finance/admin-types";

const initialState: ProfileFormState = {};

export function FamilyUserForm({ members }: { members: DbFamilyMember[] }) {
  const [state, formAction, isPending] = useActionState(createFamilyUser, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do acesso</Label>
          <Input id="name" name="name" placeholder="Ex: Pai" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email de acesso</Label>
          <Input id="email" name="email" type="email" placeholder="email@exemplo.com" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linked_family_member_id">Membro da família</Label>
          <select
            id="linked_family_member_id"
            name="linked_family_member_id"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Selecione o membro</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="access_model">Modelo de acesso</Label>
          <select
            id="access_model"
            name="access_model"
            defaultValue="basic"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="basic">Básico</option>
            <option value="family">Familiar</option>
            <option value="admin">Admin</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-white/35">
        O modelo de acesso só define as permissões iniciais. Depois o Admin pode liberar ou bloquear qualquer módulo em Admin &gt; Permissões.
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar acesso familiar"}
      </Button>
    </form>
  );
}
