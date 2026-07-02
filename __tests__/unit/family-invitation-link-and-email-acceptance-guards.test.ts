import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("family invitation link and email acceptance guards", () => {
  const adminActions = read("app/protected/admin/actions.ts");
  const familyUserForm = read("components/finance/family-user-form.tsx");
  const adminUserInvitationForm = read("components/admin/users/admin-user-invitation-form.tsx");
  const linkFeedback = read("components/admin/users/admin-invitation-link-feedback.tsx");
  const loginForm = read("components/login-form.tsx");
  const invitationsPage = read("app/convites/page.tsx");
  const pendingInvitations = read("components/invitations/pending-organization-invitations.tsx");
  const pendingActions = read("app/convites/actions.ts");
  const migration = read("supabase/migrations/079_pending_invitation_email_acceptance.sql");

  it("returns and displays a copyable invitation link for family access creation and resend", () => {
    expect(adminActions).toContain("buildadmininvitationurl");
    expect(adminActions).toContain("await buildadmininvitationurl");
    expect(adminActions).toContain("invitationurl");
    expect(adminActions).toContain("resendfamilyuserinvitation");
    expect(adminActions).toContain('operationkey: "admin.user.invitation.resend"');
    expect(familyUserForm).toContain("admininvitationlinkfeedback");
    expect(adminUserInvitationForm).toContain("resendfamilyuserinvitationwithstate");
    expect(adminUserInvitationForm).toContain("reenviar convite");
    expect(linkFeedback).toContain("navigator.clipboard.writetext");
    expect(linkFeedback).toContain("link do convite gerado");
  });

  it("routes normal post-login users through the pending invitations screen", () => {
    expect(loginForm).toContain('router.push(redirectto ?? "/convites")');
    expect(invitationsPage).toContain("get_pending_organization_invitations_for_current_email");
    expect(invitationsPage).toContain('redirect("/protected")');
    expect(pendingInvitations).toContain("você foi convidado");
    expect(pendingInvitations).toContain("entrar nessa organização");
  });

  it("accepts pending invitations by authenticated email without exposing raw tokens", () => {
    expect(pendingActions).toContain("accept_organization_invitation_by_id");
    expect(pendingActions).toContain('operationkey: "admin.invitation.accept.by_email"');
    expect(pendingActions).toContain("email_mismatch");
    expect(migration).toContain("create or replace function public.get_pending_organization_invitations_for_current_email");
    expect(migration).toContain("auth.jwt() ->> 'email'");
    expect(migration).toContain("invitation.invited_email_normalized = current_email");
    expect(migration).toContain("create or replace function public.accept_organization_invitation_by_id");
    expect(migration).toContain("current_email <> invitation_record.invited_email_normalized");
    expect(migration).toContain("grant execute on function public.accept_organization_invitation_by_id(uuid) to authenticated");
    expect(migration).not.toContain("raw_token");
  });
});
