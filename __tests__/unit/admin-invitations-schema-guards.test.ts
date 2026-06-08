import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("admin invitations schema guards", () => {
  const migration = read("supabase/migrations/044_admin_invitations_schema.sql");
  const contract = read("docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");

  it("versions invitation storage without implementing runtime", () => {
    expect(migration).toContain("create table if not exists public.organization_invitations");
    expect(migration).toContain("runtime invitation creation");
    expect(migration).toContain("admin_email removal are intentionally handled in later prs");
    expect(migration).toContain("invited_email_normalized text not null");
    expect(migration).toContain("invited_by_auth_user_id uuid not null");
    expect(migration).toContain("expires_at timestamptz not null");
    expect(migration).toContain("status text not null default 'pending'");
    expect(migration).toContain("status in ('pending', 'accepted', 'revoked', 'expired')");
  });

  it("stores only normalized email and token hashes for invitation lookup", () => {
    expect(migration).toContain("invited_email_normalized = lower(trim(invited_email_normalized))");
    expect(migration).toContain("token_hash text not null");
    expect(migration).toContain("raw invitation tokens must never be stored");
    expect(migration).toContain("organization_invitations_token_hash_idx");
    expect(migration).toContain("organization_invitations_pending_email_idx");
    expect(migration).not.toContain("raw_token");
    expect(migration).not.toContain("plain_token");
  });

  it("keeps invitations scoped to organization admins through RLS", () => {
    expect(migration).toContain("alter table public.organization_invitations enable row level security");
    expect(migration).toContain("revoke all on public.organization_invitations from anon");
    expect(migration).toContain("grant select, insert, update on public.organization_invitations to authenticated");
    expect(migration).toContain("organization_invitations_select_admin");
    expect(migration).toContain("organization_invitations_insert_admin");
    expect(migration).toContain("organization_invitations_update_admin");
    expect(migration).toContain("public.is_organization_admin(organization_id)");
    expect(migration).toContain("invited_by_auth_user_id = auth.uid()");
    expect(migration).not.toContain("for delete");
  });

  it("documents that schema preflight is complete but runtime remains blocked", () => {
    for (const source of [contract, gapRegister, roadmap, statusMap]) {
      expect(source).toContain("044_admin_invitations_schema.sql");
    }

    expect(contract).toContain("schema/preflight versionado");
    expect(contract).toContain("runtime criar/revogar/reenviar versionado");
    expect(contract).toContain("runtime aceitar/linking versionado");
    expect(gapRegister).toContain("schema/preflight is versioned");
    expect(gapRegister).toContain("create/revoke/resend runtime is versioned");
    expect(gapRegister).toContain("acceptance/linking runtime is versioned");
    expect(statusMap).toContain("email delivery, ui, cron de expiracao e runtime final seguem pendentes");
  });
});
