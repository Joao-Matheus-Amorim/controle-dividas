import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("family member invitation guards", () => {
  const adminActions = read("app/protected/admin/actions.ts").toLowerCase();
  const acceptanceRpc = read("supabase/migrations/047_accept_admin_invitation_profile_creation.sql").toLowerCase();

  it("creates an organization invitation when a family access is created", () => {
    expect(adminActions).toContain("createfamilyaccessinvitation");
    expect(adminActions).toContain('from("organization_invitations")');
    expect(adminActions).toContain("sendadmininvitationemail");
    expect(adminActions).toContain('role: role === "admin" ? "admin" : "member"');
  });

  it("keeps invitation acceptance linking the invited email to the family profile", () => {
    expect(acceptanceRpc).toContain("lower(trim(coalesce(email, ''))) = invitation_record.invited_email_normalized");
    expect(acceptanceRpc).toContain("auth_user_id = current_auth_user_id");
    expect(acceptanceRpc).toContain("when invitation_record.role = 'member' then 'user'");
  });
});
