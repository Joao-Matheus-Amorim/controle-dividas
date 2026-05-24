import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readRunbook() {
  return readFileSync(
    join(process.cwd(), "docs/runbooks/LEGACY_ORGANIZATION_BACKFILL_RUNBOOK.md"),
    "utf8",
  );
}

function normalize(text: string) {
  return text.toLowerCase();
}

describe("legacy organization backfill runbook", () => {
  const runbook = normalize(readRunbook());

  it("requires the read-only preflight before any backfill", () => {
    expect(runbook).toContain("docs/sql/legacy-organization-null-preflight.sql");
    expect(runbook).toContain("mandatory preflight evidence");
    expect(runbook).toContain("before any future backfill pr is approved");
  });

  it("requires the read-only deterministic mapping dry-run before any backfill", () => {
    expect(runbook).toContain("docs/sql/legacy-organization-backfill-dry-run.sql");
    expect(runbook).toContain("deterministic mapping dry-run");
    expect(runbook).toContain("run `docs/sql/legacy-organization-backfill-dry-run.sql`");
    expect(runbook).toContain("confirm the dry-run reports deterministic mapping");
  });

  it("requires deterministic ownership mapping and no guessing", () => {
    expect(runbook).toContain("owner-to-organization mapping is deterministic");
    expect(runbook).toContain("the mapping requires guessing");
    expect(runbook).toContain("stop immediately");
  });

  it("requires blocked or ambiguous dry-run rows to stop the backfill", () => {
    expect(runbook).toContain("blocked or ambiguous");
    expect(runbook).toContain("exclude or separately plan any row reported as blocked or ambiguous");
    expect(runbook).toContain("the dry-run reports blocked or ambiguous rows that the backfill would update");
  });

  it("requires rollback before execution", () => {
    expect(runbook).toContain("rollback strategy");
    expect(runbook).toContain("rollback requirements");
    expect(runbook).toContain("a rollback plan that says only \"revert the pr\" is not enough");
  });

  it("requires post-backfill validation", () => {
    expect(runbook).toContain("post-backfill validation");
    expect(runbook).toContain("rerun");
    expect(runbook).toContain("target table has fewer or zero `organization_id is null` rows");
  });

  it("blocks not-null hardening and owner fallback removal until prerequisites are met", () => {
    expect(runbook).toContain("blocking criteria for `organization_id not null`");
    expect(runbook).toContain("blocking criteria for removing legacy `owner_id` fallback");
    expect(runbook).toContain("do not add `organization_id not null` until");
    expect(runbook).toContain("do not remove legacy `owner_id` fallback until");
  });
});
