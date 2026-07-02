"use client";

import { UserPlus } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { FamilyUserForm } from "@/components/finance/family-user-form";
import type { DbFamilyMember } from "@/lib/finance/types";

export function FamilyUserFormDialog({ members, memberCreateHref }: { members: DbFamilyMember[]; memberCreateHref: string }) {
  return (
    <AppFormSheet
      title="Novo usuário"
      description="Envie um convite de acesso vinculado a um membro financeiro."
      triggerLabel="Convidar usuário"
      icon={UserPlus}
    >
      <FamilyUserForm members={members} memberCreateHref={memberCreateHref} />
    </AppFormSheet>
  );
}
