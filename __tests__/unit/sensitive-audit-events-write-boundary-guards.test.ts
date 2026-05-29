import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/041_audit_events_write_boundary.sql";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function withoutComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/g, ""))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

function version(filename: string) {
  return filename.match(/^(\d+)_/)?.[1] ?? null;
}

describe("sensitive audit events write boundary guards", () => {
  const migration = withoutComments(read(migrationPath));
  const plan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("uses a unique migration version prefix", () => {
    const migrationFiles = readdirSync(join(process.cwd(), "supabase/migrations")).filter((file) =>
      file.endsWith(".sql"),
    );
    const versions = migrationFiles.map(version).filter(Boolean);
    const duplicateVersions = versions.filter((item, index) => versions.indexOf(item) !== index);

    expect(duplicateVersions).toEqual([]);
    expect(migrationFiles).toContain(basename(migrationPath));
  });

  it("creates an authenticated security-definer write boundary", () => {
    expect(migration).toContain("create or replace function public.record_audit_event");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("current_auth_user_id uuid := auth.uid()");
    expect(migration).toContain("grant execute on function public.record_audit_event");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("revoke all on function public.record_audit_event");
    expect(migration).toContain("from anon");
  });

  it("derives actor server-side and validates organization membership", () => {
    expect(migration).toContain("actor_user_id");
    expect(migration).toContain("current_auth_user_id");
    expect(migration).toContain("p_organization_id is null");
    expect(migration).toContain("not public.is_organization_member(p_organization_id)");
    expect(migration).toContain("organization membership is required");
    expect(migration).not.toContain("p_actor_user_id");
  });

  it("keeps metadata redacted and operation keys stable", () => {
    expect(migration).toContain("jsonb_typeof(sanitized_metadata) <> 'object'");
    expect(migration).toContain("metadata contains forbidden sensitive keys");
    expect(migration).toContain("password|token|secret|service_role|stripe_secret|raw_payload|full_payload|before|after|notes");
    expect(migration).toContain("p_action !~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'");
    expect(migration).toContain("p_target_type !~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'");
    expect(migration).toContain("p_outcome not in ('success', 'denied', 'validation_error', 'failure')");
  });

  it("does not add unrelated controls", () => {
    expect(migration).not.toContain("create trigger");
    expect(migration).not.toContain("create policy");
    expect(migration).not.toContain("alter table public.audit_events");
    expect(migration).not.toContain("rate_limit");
    expect(migration).not.toContain("retention_job");
    expect(migration).not.toContain("checkout");
  });

  it("keeps GAP-015 docs aligned with write boundary and billing checkout progress", () => {
    for (const source of [plan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("041_audit_events_write_boundary.sql");
      expect(source).toContain("record_audit_event");
    }

    expect(plan).toContain("billing checkout runtime calls `record_audit_event`");
    expect(contract).toContain("audit event write boundary exists");
    expect(roadmap).toContain("write boundary de audit events");
    expect(liveStatus).toContain("write boundary de audit events");
    expect(gapRegister).toContain("audit event write boundary");
  });
});
