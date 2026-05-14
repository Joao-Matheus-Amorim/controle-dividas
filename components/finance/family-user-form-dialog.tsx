"use client";

import { UserPlus } from "lucide-react";

import { AppFormDialog } from "@/components/app/app-form-dialog";
import { FamilyUserForm } from "@/components/finance/family-user-form";
import type { DbFamilyMember } from "@/lib/finance/server";

export function FamilyUserFormDialog({ members }: { members: DbFamilyMember[] }) {
  return (
    <AppFormDialog
      title="Novo usuário"
      description="Cadastre um acesso familiar e vincule a um membro financeiro."
      triggerLabel="Novo usuário"
      icon={UserPlus}
    >
      <FamilyUserForm members={members} />
    </AppFormDialog>
  );
}
