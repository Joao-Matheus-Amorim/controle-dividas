"use client";

import { useActionState } from "react";

import {
  updateFamilyMemberLimitWithState,
  type SettingsActionState,
} from "@/app/protected/configuracoes/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbFamilyMember } from "@/lib/finance/types";

const initialState: SettingsActionState = {};

export function SettingsMemberLimitForm({ member }: { member: DbFamilyMember }) {
  const [state, formAction, isPending] = useActionState(
    updateFamilyMemberLimitWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="hidden" name="id" value={member.id} />
        <Input
          name="monthly_limit"
          type="number"
          min="0"
          step="0.01"
          defaultValue={Number(member.monthly_limit)}
          className="h-9 w-28 rounded-xl border-white/10 bg-[#080810] text-xs text-white"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
