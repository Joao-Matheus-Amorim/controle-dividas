"use client";

import { useActionState } from "react";

import {
  toggleFamilyMemberStatusWithState,
  type FamilyMemberActionState,
} from "@/app/protected/pessoas/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";

const initialState: FamilyMemberActionState = {};

interface PeopleStatusFormProps {
  memberId: string;
  isActive: boolean;
}

export function PeopleStatusForm({ memberId, isActive }: PeopleStatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    toggleFamilyMemberStatusWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={memberId} />
      <input type="hidden" name="is_active" value={String(isActive)} />
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="h-9 rounded-xl border-border bg-transparent text-foreground hover:bg-ff-bg-soft hover:text-foreground"
      >
        {isPending ? "Salvando..." : isActive ? "Desativar" : "Ativar"}
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
