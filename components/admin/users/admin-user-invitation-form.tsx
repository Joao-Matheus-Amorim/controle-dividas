"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";

import { resendFamilyUserInvitationWithState } from "@/app/protected/admin/action-state";
import type { FamilyUserActionState } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { AdminInvitationLinkFeedback } from "./admin-invitation-link-feedback";

const initialState: FamilyUserActionState = {};

export function AdminUserInvitationForm({ profileId }: { profileId: string }) {
  const [state, formAction, isPending] = useActionState(
    resendFamilyUserInvitationWithState,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={profileId} />
      <Button type="submit" variant="outline" disabled={isPending} className="h-9 rounded-xl">
        <Send className="mr-2 h-4 w-4" />
        {isPending ? "Gerando..." : "Reenviar convite"}
      </Button>
      <AppActionFeedback error={state.error} success={state.success} className="max-w-[320px] text-xs" />
      <AdminInvitationLinkFeedback invitationUrl={state.invitationUrl} />
    </form>
  );
}
