"use client";

import { useActionState, useState } from "react";

import { deleteFamilyUserWithState } from "@/app/protected/admin/action-state";
import type { FamilyUserActionState } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const initialState: FamilyUserActionState = {};

export function AdminUserDeleteForm({ profileId }: { profileId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteFamilyUserWithState,
    initialState,
  );
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="id" value={profileId} />
      <input type="hidden" name="confirm_delete" value={isConfirmed ? "confirmado" : ""} />
      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={(event) => setIsConfirmed(event.target.checked)}
          className="mt-0.5"
        />
        <span>Confirmar exclusao</span>
      </label>
      <Button
        type="submit"
        variant="outline"
        size="icon"
        disabled={!isConfirmed || isPending}
        aria-label="Excluir acesso"
        className="h-9 w-9 rounded-xl border-ff-destructive bg-ff-destructive-soft text-ff-destructive hover:bg-ff-destructive-soft"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
