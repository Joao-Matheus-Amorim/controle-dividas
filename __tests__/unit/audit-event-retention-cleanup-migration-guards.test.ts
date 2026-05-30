import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/042_audit_events_retention_cleanup.sql";

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

describe("audit event retention cleanup migration guards", () => {
  const migration = withoutComments(read(migrationPath));

  it("uses a unique migration version prefix", () => {
    const migrationFiles = readdirSync(join(process.cwd(), "supabase/migrations")).filter((file) =>
      file.endsWith(".sql"),
    );
    const versions = migrationFiles.map(version).filter(Boolean);
    const duplicateVersions = versions.filter((item, index) => versions.indexOf(item) !== index);

    expect(duplicateVersions).toEqual([]);
    expect(migrationFiles).toContain(basename(migrationPath));
  });

  it("creates an owner/admin-only cleanup rpc for expired audit events", () => {
    expect(migration).toContain("create or replace function public.cleanup_expired_audit_events");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("auth.uid() is null");
    expect(migration).toContain("p_organization_id is null");
    expect(migration).toContain("p_cutoff is null");
    expect(migration).toContain("p_cutoff > now() - interval '365 days'");
    expect(migration).toContain("retention cutoff must be at least 365 days old");
    expect(migration).toContain("not public.is_organization_admin(p_organization_id)");
    expect(migration).toContain("delete from public.audit_events");
    expect(migration).toContain("organization_id = p_organization_id");
    expect(migration).toContain("occurred_at < p_cutoff");
    expect(migration).toContain("get diagnostics deleted_count = row_count");
  });

  it("keeps the cleanup boundary narrow", () => {
    expect(migration).toContain("grant execute on function public.cleanup_expired_audit_events");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("revoke all on function public.cleanup_expired_audit_events");
    expect(migration).toContain("from anon");
    expect(migration).not.toContain("create policy");
    expect(migration).not.toContain("alter table public.audit_events");
    expect(migration).not.toContain("cron");
    expect(migration).not.toContain("queue");
    expect(migration).not.toContain("billing");
  });
});
