"use client";

import { useActionState } from "react";

import {
  deleteExpenseCategoryWithState,
  type SettingsActionState,
} from "@/app/protected/configuracoes/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const initialState: SettingsActionState = {};

export function SettingsCategoryDeleteForm({ categoryId }: { categoryId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteExpenseCategoryWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="id" value={categoryId} />
      <Button
        type="submit"
        variant="outline"
        size="icon"
        disabled={isPending}
        aria-label="Excluir categoria"
        className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
