import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("profiles evidence status", () => {
  const evidence = read("docs/audits/PROFILES_EVIDENCE_STATUS.md");

  it("does not claim readiness without target-environment output", () => {
    expect(evidence).toContain("evidence status: pending target-environment output");
    expect(evidence).toContain("hardening status: blocked until explicit evidence is reviewed");
    expect(evidence).not.toContain("evidence status: ready");
    expect(evidence).not.toContain("hardening status: ready");
  });

  it("links the required read-only checks", () => {
    expect(evidence).toContain("docs/sql/profile-organization-null-check.sql");
    expect(evidence).toContain("docs/sql/profile-organization-dry-run.sql");
  });

  it("keeps the PR out of schema, data, runtime, RLS, UI, billing, E2E and fallback changes", () => {
    expect(evidence).toContain("no migration");
    expect(evidence).toContain("no schema change");
    expect(evidence).toContain("no data change");
    expect(evidence).toContain("no runtime change");
    expect(evidence).toContain("no rls change");
    expect(evidence).toContain("no ui change");
    expect(evidence).toContain("no billing change");
    expect(evidence).toContain("no e2e change");
    expect(evidence).toContain("no fallback removal");
  });
});
