import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("admin invitation acceptance rpc guards", () => {
  const migration = read("supabase/migrations/045_accept_admin_invitation_rpc.sql");
  const action = read("app/auth/convite/actions.ts");

  it("keeps invitation acceptance server-side and transactional", () => {
    expect(migration).toContain("create or replace function public.accept_organization_invitation");
    expect(migration).toContain("security definer");
    expect(migration).toContain("for update");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("auth.jwt() ->> 'email'");
    expect(migration).toContain("encode(digest(normalized_token, 'sha256'), 'hex')");
    expect(migration).toContain("on conflict (organization_id, auth_user_id)");
    expect(migration).toContain("do update set");
    expect(migration).toContain("status = 'accepted'");
    expect(migration).toContain("invited_auth_user_id = current_auth_user_id");
    expect(migration).toContain("grant execute on function public.accept_organization_invitation(text) to authenticated");
  });

  it("links profiles by organization and email without trusting client organization_id", () => {
    expect(migration).toContain("where organization_id = invitation_record.organization_id");
    expect(migration).toContain("lower(trim(coalesce(email, ''))) = invitation_record.invited_email_normalized");
    expect(migration).toContain("not exists");
    expect(action).not.toContain("createAdminClient");
    expect(action).not.toContain("formData.get(\"organization");
    expect(action).not.toContain("formdata.get(\"organization");
  });

  it("keeps raw invitation tokens out of storage and audit metadata", () => {
    expect(migration).toContain("stores no raw token");
    expect(action).toContain("invitationtokenlookupkey");
    expect(action).toContain("targetkey: invitationtokenlookupkey(token)");
    expect(action).toContain("action: \"admin.invitation.accept\"");
    expect(action).toContain("profile_linked");
    expect(action).not.toContain("metadata: {\n      token");
    expect(action).not.toContain("targetKey: token");
  });
});
