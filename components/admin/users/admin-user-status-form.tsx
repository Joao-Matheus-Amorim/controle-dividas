"use client";

import { useActionState } from "react";

import { toggleFamilyUserStatusWithState } from "@/app/protected/admin/action-state";
import type { FamilyUserActionState } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";

const initialState: FamilyUserActionState = {};

interface AdminUserStatusFormProps {
  profileId: string;
  isActive: boolean;
  disabled?: boolean;
}

export function AdminUserStatusForm({ profileId, isActive, disabled = false }: AdminUserStatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    toggleFamilyUserStatusWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={profileId} />
      <input type="hidden" name="is_active" value={String(isActive)} />
      <Button
        type="submit"
        variant="outline"
        disabled={disabled || isPending}
        className="h-9 rounded-xl border-border bg-transparent text-foreground hover:bg-ff-bg-soft hover:text-foreground disabled:opacity-40"
      >
        {isPending ? "Salvando..." : isActive ? "Desativar" : "Ativar"}
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
