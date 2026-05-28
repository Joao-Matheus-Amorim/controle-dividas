import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("RLS Live Gate workflow", () => {
  const defaultCi = read(".github/workflows/ci.yml");
  const rlsGate = read(".github/workflows/rls-live-gate.yml");
  const docs = read("docs/rls/RLS_LIVE_GATE.md");

  it("keeps the RLS gate separate from the default CI workflow", () => {
    expect(rlsGate).toContain("name: rls live gate");
    expect(defaultCi).toContain("name: ci");
    expect(defaultCi).not.toContain("run_rls_tests: \"true\"");
    expect(defaultCi).not.toContain("rls_test_supabase_url");
  });

  it("keeps the RLS gate manual-only", () => {
    expect(rlsGate).toContain("workflow_dispatch:");
    expect(rlsGate).not.toContain("pull_request:");
    expect(rlsGate).not.toContain("push:");
  });

  it("requires the dedicated RLS environment contract", () => {
    expect(rlsGate).toContain("run_rls_tests: \"true\"");
    expect(rlsGate).toContain("rls_test_supabase_url");
    expect(rlsGate).toContain("rls_test_supabase_anon_key");
    expect(rlsGate).toContain("rls_test_supabase_service_role_key");
    expect(rlsGate).toContain("rls_test_user_a_email");
    expect(rlsGate).toContain("rls_test_user_a_password");
    expect(rlsGate).toContain("rls_test_user_b_email");
    expect(rlsGate).toContain("rls_test_user_b_password");
  });

  it("publishes audit-friendly execution evidence without printing secrets", () => {
    expect(rlsGate).toContain("github_step_summary");
    expect(rlsGate).toContain("actions/upload-artifact@v4");
    expect(rlsGate).toContain("rls-live-gate-evidence");
    expect(rlsGate).toContain("secret values are intentionally not printed");
    expect(docs).toContain("github step summary");
    expect(docs).toContain("artifact");
    expect(docs).toContain("secret values are intentionally not printed");
    expect(docs).toContain("only record this gate as ci evidence");
    expect(docs).toContain("after a real github actions run has completed successfully");
  });

  it("documents manual operation and safety boundaries", () => {
    expect(docs).toContain("manual-only");
    expect(docs).toContain("workflow_dispatch");
    expect(docs).toContain("must not point to production");
    expect(docs).toContain("service role credentials are allowed only for setup and cleanup");
    expect(docs).toContain("must not be used as proof of user-level access");
  });

  it("keeps runtime, schema, policy, UI, billing, and E2E changes out of scope", () => {
    expect(docs).toContain("does not change:");
    expect(docs).toContain("rls policies");
    expect(docs).toContain("migrations");
    expect(docs).toContain("runtime code");
    expect(docs).toContain("ui");
    expect(docs).toContain("billing");
    expect(docs).toContain("e2e");
  });
});
