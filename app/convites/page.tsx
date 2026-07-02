import { redirect } from "next/navigation";

import {
  PendingOrganizationInvitations,
  type PendingOrganizationInvitation,
} from "@/components/invitations/pending-organization-invitations";
import { createClient } from "@/lib/supabase/server";

export default async function PendingInvitationsPage() {
  const supabase = await createClient();
  const { data: claimsResult, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsResult?.claims?.sub) {
    redirect("/auth/login?next=/convites");
  }

  const { data, error } = await supabase.rpc("get_pending_organization_invitations_for_current_email");

  if (error) {
    throw new Error(error.message);
  }

  const invitations = (data ?? []) as PendingOrganizationInvitation[];

  if (invitations.length === 0) {
    redirect("/protected");
  }

  return (
    <main className="dark relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,142,77,0.18),transparent_34%),radial-gradient(circle_at_82%_72%,rgba(198,142,77,0.08),transparent_28%),linear-gradient(135deg,#14110F_0%,#1a1613_48%,#14110F_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 flex min-h-svh items-center justify-center px-6 py-10">
        <PendingOrganizationInvitations invitations={invitations} />
      </div>
    </main>
  );
}
