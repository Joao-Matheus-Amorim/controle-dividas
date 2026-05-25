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

  it("records readiness for the next evidence step only", () => {
    expect(readiness).toContain("ready for read-only preflight and dry-run");
    expect(readiness).toContain("should not be hardened in this pr");
    expect(readiness).toContain("fresh null-organization preflight evidence");
    expect(readiness).toContain("fresh deterministic dry-run evidence");
    expect(readiness).toContain("no table-specific preflight/dry-run sql exists yet");
  });
});