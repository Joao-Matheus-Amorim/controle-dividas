"use client";

import { UserPlus } from "lucide-react";

import { AppFormDialog } from "@/components/app/app-form-dialog";
import { FamilyMemberForm } from "@/components/finance/family-member-form";

export function FamilyMemberFormDialog() {
  return (
    <AppFormDialog
      title="Nova pessoa"
      description="Cadastre um membro financeiro da família e defina o limite mensal."
      triggerLabel="Nova pessoa"
      icon={UserPlus}
    >
      <FamilyMemberForm />
    </AppFormDialog>
  );
}
