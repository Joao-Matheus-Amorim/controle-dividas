import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("feature decision status", () => {
  const status = read("docs/audits/FEATURE_DECISION_STATUS.md");
  const readiness = read("docs/audits/USER_FEATURE_PERMISSIONS_ORGANIZATION_SCOPE_READINESS.md");

  it("records that feature permissions will be used while hardening remains blocked", () => {
    expect(status).toContain("decision status: use feature permissions");
    expect(status).toContain("write path status: scoped callable write path added");
    expect(status).toContain("hardening status: blocked until readiness, preflight, and dry-run are completed");
    expect(status).not.toContain("hardening status: ready");
    expect(status).not.toContain("decision status: pending");
  });

  it("keeps the next step explicit", () => {
    expect(status).toContain("the product will keep and use feature permissions");
    expect(status).toContain("writes feature permission rows with organization scope from the active organization");
    expect(status).toContain("minimal callable feature permissions form");
    expect(status).toContain("readiness, read-only preflight, and read-only dry-run evidence");
  });

  it("keeps this PR out of schema and rollout changes", () => {
    expect(status).toContain("no migration");
    expect(status).toContain("no schema change");
    expect(status).toContain("no rls change");
    expect(status).toContain("no billing change");
    expect(status).toContain("no e2e change");
  });

  it("records readiness for evidence review only", () => {
    expect(readiness).toContain("readiness: read-only preflight and dry-run checks added");
    expect(readiness).toContain("evidence review: pending target-environment output review");
    expect(readiness).toContain("hardening: blocked until reviewed output shows no unsafe legacy rows");
    expect(readiness).toContain("next safe step: record target-environment preflight/dry-run output");
    expect(readiness).toContain("null_organization_rows_without_matching_profile_scope");
    expect(readiness).toContain("dry-run `needs_review` is zero");
  });
});