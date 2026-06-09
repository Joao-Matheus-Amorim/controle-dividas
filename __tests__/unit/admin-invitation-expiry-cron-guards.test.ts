import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("admin invitation expiry cron guards", () => {
  const migration = read("supabase/migrations/046_admin_invitation_expiry_cleanup.sql");
  const route = read("app/api/cron/admin-invitations/expire/route.ts");
  const vercelConfig = read("vercel.json");
  const deliveryContract = read("docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("versions a service-role only RPC that expires pending invites by cutoff", () => {
    expect(migration).toContain("create or replace function public.expire_pending_organization_invitations");
    expect(migration).toContain("security definer");
    expect(migration).toContain("where status = 'pending'");
    expect(migration).toContain("and expires_at <= p_cutoff");
    expect(migration).toContain("status = 'expired'");
    expect(migration).toContain("get diagnostics expired_count = row_count");
    expect(migration).toContain("revoke all on function public.expire_pending_organization_invitations(timestamptz) from authenticated");
    expect(migration).toContain("grant execute on function public.expire_pending_organization_invitations(timestamptz) to service_role");
  });

  it("keeps the cron route fail-closed and free of raw invite tokens", () => {
    expect(route).toContain("createadminclient");
    expect(route).toContain("cron_secret");
    expect(route).toContain("authorization");
    expect(route).toContain("bearer ");
    expect(route).toContain("expire_pending_organization_invitations");
    expect(route).toContain("expiredcount");
    expect(route).not.toContain("recordauditevent");
    expect(route).not.toContain("token");
  });

  it("schedules the cleanup and updates live planning state", () => {
    expect(vercelConfig).toContain("\"path\": \"/api/cron/admin-invitations/expire\"");
    expect(vercelConfig).toContain("\"schedule\": \"0 3 * * *\"");
    expect(deliveryContract).toContain("cron de expiracao versionado");
    expect(deliveryContract).toContain("cron_secret");
    expect(deliveryContract).toContain("invitation expiry cron must not expose a public cleanup endpoint");
    expect(deliveryContract).toContain("gate runtime de admin_email removido e owner_id retirement segue pendente");
    expect(gapRegister).toContain("cron expiry is versioned");
    expect(gapRegister).toContain("no longer use `admin_email` as a runtime gate");
  });
});
