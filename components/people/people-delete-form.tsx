"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  deleteFamilyMemberWithState,
  type FamilyMemberActionState,
} from "@/app/protected/pessoas/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import type { DbFamilyMember } from "@/lib/finance/types";

const initialState: FamilyMemberActionState = {};

export function PeopleDeleteForm({ member }: { member: DbFamilyMember }) {
  const [state, formAction, isPending] = useActionState(
    deleteFamilyMemberWithState,
    initialState,
  );
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 p-3">
      <input type="hidden" name="id" value={member.id} />
      <input type="hidden" name="confirm_delete" value={isConfirmed ? "confirmado" : ""} />

      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8da0]">
          Excluir pessoa
        </p>
        <p className="text-sm text-white/50">
          Exclui apenas pessoas sem gastos, contas, bancos, movimentacoes ou
          acesso vinculado. Desative a pessoa em vez de excluir quando ja houver
          historico.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={(event) => setIsConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span>Confirmo que quero excluir {member.name} definitivamente.</span>
      </label>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button
        type="submit"
        variant="outline"
        disabled={!isConfirmed || isPending}
        className="w-full rounded-xl border-[#f0506e]/30 bg-transparent text-[#ff8da0] hover:bg-[#f0506e]/15 hover:text-white"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {isPending ? "Excluindo..." : "Excluir pessoa"}
      </Button>
    </form>
  );
}
