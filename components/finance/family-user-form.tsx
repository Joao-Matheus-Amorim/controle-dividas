"use client";

import { useActionState } from "react";

import { createFamilyUser } from "@/app/protected/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileFormState } from "@/lib/finance/admin-server";
import type { DbFamilyMember } from "@/lib/finance/server";

const initialState: ProfileFormState = {};

export function FamilyUserForm({ members }: { members: DbFamilyMember[] }) {
  const [state, formAction, isPending] = useActionState(createFamilyUser, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do usuario</Label>
          <Input id="name" name="name" placeholder="Ex: Pai" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="email@exemplo.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linked_family_member_id">Membro financeiro</Label>
          <select
            id="linked_family_member_id"
            name="linked_family_member_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sem vinculo</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Perfil</Label>
          <select
            id="role"
            name="role"
            defaultValue="user"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="user">Usuario familiar</option>
            <option value="admin">Admin familiar</option>
          </select>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar usuario familiar"}
      </Button>
    </form>
  );
}
