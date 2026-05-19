"use client";

import { UserPlus } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { FamilyUserForm } from "@/components/finance/family-user-form";
import type { DbFamilyMember } from "@/lib/finance/server";

export function FamilyUserFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormSheet
      title="Novo usuário"
      description="Cadastre um acesso familiar e vincule a um membro financeiro."
      triggerLabel="Novo usuário"
      icon={UserPlus}
    >
      <FamilyUserForm members={members} />
    </AppFormSheet>
  );
}