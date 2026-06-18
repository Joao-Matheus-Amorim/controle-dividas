"use client";

import { useActionState } from "react";
import { RotateCcw } from "lucide-react";

import {
  reverseFinancialMovement,
  type MovementReversalActionState,
} from "@/app/protected/movimentacoes/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";

const initialState: MovementReversalActionState = {};

type MovementReversalFormProps = {
  movementId: string;
};

export function MovementReversalForm({ movementId }: MovementReversalFormProps) {
  const [state, formAction, isPending] = useActionState(reverseFinancialMovement, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={movementId} />
      <input type="hidden" name="reason" value="Estorno operacional" />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={isPending}
        className="h-8 rounded-xl border-white/10 bg-transparent px-3 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white"
      >
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        {isPending ? "Estornando..." : "Estornar"}
      </Button>
      <AppActionFeedback error={state.error} success={state.success} />
    </form>
  );
}
