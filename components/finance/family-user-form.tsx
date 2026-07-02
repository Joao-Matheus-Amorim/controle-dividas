"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createFamilyUser } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DbFamilyMember } from "@/lib/finance/types";
import type { ProfileFormState } from "@/lib/finance/admin-types";

const initialState: ProfileFormState = {};

export function FamilyUserForm({ members, memberCreateHref }: { members: DbFamilyMember[]; memberCreateHref: string }) {
  const [state, formAction, isPending] = useActionState(createFamilyUser, initialState);
  const hasMembers = members.length > 0;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do acesso</Label>
          <Input id="name" name="name" placeholder="Ex: Responsavel financeiro" required />
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
            required={hasMembers}
            disabled={!hasMembers}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{hasMembers ? "Selecione o membro" : "Nenhum membro cadastrado"}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          {!hasMembers ? (
            <div className="rounded-2xl border border-border bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
              Cadastre primeiro o membro financeiro que vai usar este acesso.
              <Link href={memberCreateHref} className="mt-2 inline-flex font-semibold text-primary underline-offset-4 hover:underline">
                Ir para criação de membro
              </Link>
            </div>
          ) : null}
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

      <div className="rounded-2xl border border-border bg-ff-bg-soft p-3 text-xs leading-5 text-ff-subtle-foreground">
        O modelo de acesso define as permissões iniciais. Ao cadastrar, o app envia um convite para este email entrar direto na família.
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending || !hasMembers}>
        {isPending ? "Enviando convite..." : "Enviar convite familiar"}
      </Button>
    </form>
  );
}
