import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/040_audit_events_schema.sql";

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

describe("sensitive audit events schema guards", () => {
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

  it("creates only the audit_events storage surface", () => {
    expect(migration).toContain("create table if not exists public.audit_events");
    expect(migration).toContain("id uuid primary key default gen_random_uuid()");
    expect(migration).toContain("occurred_at timestamptz not null default now()");
    expect(migration).toContain("actor_user_id uuid not null");
    expect(migration).toContain("organization_id uuid not null references public.organizations(id) on delete restrict");
    expect(migration).toContain("metadata jsonb not null default '{}'::jsonb");
    expect(migration).toContain("audit_events_outcome_check");
    expect(migration).toContain("audit_events_metadata_object_check");
  });

  it("adds read-side RLS for organization admins only", () => {
    expect(migration).toContain("alter table public.audit_events enable row level security");
    expect(migration).toContain("revoke all on public.audit_events from anon");
    expect(migration).toContain("revoke all on public.audit_events from authenticated");
    expect(migration).toContain("grant select on public.audit_events to authenticated");
    expect(migration).toContain('create policy "audit_events_select_organization_admin"');
    expect(migration).toContain("for select");
    expect(migration).toContain("using (public.is_organization_admin(organization_id))");
  });

  it("does not add runtime writes or broad side effects", () => {
    expect(migration).not.toContain("for insert");
    expect(migration).not.toContain("for update");
    expect(migration).not.toContain("for delete");
    expect(migration).not.toContain("create or replace function");
    expect(migration).not.toContain("create trigger");
    expect(migration).not.toContain("http");
    expect(migration).not.toContain("stripe_");
  });

  it("keeps GAP-015 docs aligned with schema-only progress", () => {
    for (const source of [plan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("040_audit_events_schema.sql");
    }

    expect(plan).toContain("billing checkout audit runtime exists");
    expect(plan).toContain("no insert/update/delete policy for authenticated users");
    expect(contract).toContain("audit event runtime logging");
    expect(roadmap).toContain("schema/read-side rls de audit events");
    expect(liveStatus).toContain("sensitive-action audit logging runtime");
    expect(gapRegister).toContain("sensitive-action audit logging runtime");
  });
});
