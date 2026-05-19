"use client";

import { UserPlus } from "lucide-react";

import { AppFormSheet } from "@/components/app/app-form-sheet";
import { FamilyMemberForm } from "@/components/finance/family-member-form";

export function FamilyMemberFormDialog() {
  return (
    <AppFormSheet
      title="Nova pessoa"
      description="Cadastre um membro financeiro e defina o limite mensal."
      triggerLabel="Nova pessoa"
      icon={UserPlus}
    >
      <FamilyMemberForm />
    </AppFormSheet>
  );
}
