"use client";

import { useActionState } from "react";

import { syncFamilyUserAuthLinkWithState } from "@/app/protected/admin/action-state";
import type { FamilyUserActionState } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

const initialState: FamilyUserActionState = {};

export function AdminUserSyncForm({ profileId }: { profileId: string }) {
  const [state, formAction, isPending] = useActionState(
    syncFamilyUserAuthLinkWithState,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={profileId} />
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="h-9 rounded-xl border-[#8b72f8]/30 bg-[#8b72f8]/10 text-[#b09cff] hover:bg-[#8b72f8]/20"
      >
        <Link2 className="mr-2 h-4 w-4" />
        {isPending ? "Sincronizando..." : "Sincronizar login"}
      </Button>

      <AppActionFeedback error={state.error} success={state.success} className="max-w-[220px] text-xs" />
    </form>
  );
}
