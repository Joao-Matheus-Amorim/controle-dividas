"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  deleteReceivableIncomeSource,
  type SettingsActionState,
} from "@/app/protected/configuracoes/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";

const initialState: SettingsActionState = {};

export function SettingsReceivableIncomeSourceDeleteForm({
  sourceId,
}: {
  sourceId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteReceivableIncomeSource,
    initialState,
  );
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="id" value={sourceId} />
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
        aria-label="Excluir origem"
        className="h-9 w-9 rounded-xl border-border bg-transparent text-ff-subtle-foreground hover:bg-ff-bg-soft hover:text-foreground"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
