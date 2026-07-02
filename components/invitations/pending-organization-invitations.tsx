"use client";

import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import {
  acceptPendingOrganizationInvitation,
  type AcceptPendingInvitationState,
} from "@/app/convites/actions";
import { Button } from "@/components/ui/button";
import { getOrganizationPath } from "@/lib/organizations/paths";

export type PendingOrganizationInvitation = {
  invitation_id: string;
  organization_id: string;
  organization_slug: string;
  organization_name: string;
  role: string;
  expires_at: string;
  created_at: string;
};

const initialState: AcceptPendingInvitationState = {};

function roleLabel(role: string) {
  return role === "admin" ? "Admin" : "Membro";
}

export function PendingOrganizationInvitations({ invitations }: { invitations: PendingOrganizationInvitation[] }) {
  const [state, formAction, isPending] = useActionState(
    acceptPendingOrganizationInvitation,
    initialState,
  );
  const acceptedHref = state.organizationSlug ? getOrganizationPath(state.organizationSlug) : "/protected";

  return (
    <div className="w-full max-w-2xl rounded-[2rem] border border-border bg-ff-bg-soft p-5 text-foreground shadow-ff-lg sm:p-6">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-ff-subtle-foreground">
            Convites pendentes
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-foreground">
            Você foi convidado
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Aceite para entrar direto na organização vinculada ao seu email.
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border border-border bg-primary text-primary-foreground shadow-ff-lg">
          <Building2 className="h-6 w-6" />
        </div>
      </div>

      {state.success ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-ff-success bg-ff-success-soft px-4 py-4 text-sm text-ff-success">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.success}</span>
            </div>
          </div>
          <Button asChild className="h-12 w-full rounded-2xl">
            <Link href={acceptedHref}>
              Entrar na organização
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {state.error ? (
            <div className="rounded-2xl border border-ff-destructive bg-ff-destructive-soft px-4 py-3 text-sm text-ff-destructive">
              {state.error}
            </div>
          ) : null}

          {invitations.map((invitation) => (
            <form key={invitation.invitation_id} action={formAction} className="rounded-2xl border border-border bg-background/60 p-4">
              <input type="hidden" name="invitation_id" value={invitation.invitation_id} />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{invitation.organization_name}</p>
                  <p className="mt-1 text-xs text-ff-subtle-foreground">
                    Perfil: {roleLabel(invitation.role)} · expira em {new Date(invitation.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button type="submit" disabled={isPending} className="h-11 rounded-xl">
                  {isPending ? "Aceitando..." : "Entrar nessa organização"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
