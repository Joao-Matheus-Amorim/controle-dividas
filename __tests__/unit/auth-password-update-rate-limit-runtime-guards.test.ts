import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("auth password update rate limit runtime guards", () => {
  const updateActions = read("app/auth/update-password/actions.ts");
  const updateForm = read("components/update-password-form.tsx");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("rate limits password updates server-side before Supabase update", () => {
    expect(updateActions).toContain("updatepassword");
    expect(updateActions).toContain("checksensitiveoperationratelimit");
    expect(updateActions).toContain('operationkey: "auth.password_update.submit"');
    expect(updateActions).toContain("getclaims");
    expect(updateActions).toContain("getpasswordupdateratelimitactorkey");
    expect(updateActions).toContain('"missing-session"');
    expect(updateActions).toContain('organizationid: "public-auth"');
    expect(updateActions).toContain("limit: 10");
    expect(updateActions).toContain("windowms: 10 * 60 * 1000");
    expect(updateActions.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      updateActions.indexOf("updateuser"),
    );
    expect(updateActions.indexOf('typeof password !== "string"')).toBeLessThan(
      updateActions.indexOf("updateuser"),
    );
  });

  it("keeps the update password form behind the server action boundary", () => {
    expect(updateForm).toContain("updatepassword");
    expect(updateForm).not.toContain("updateuser");
    expect(updateForm).not.toContain("@/lib/supabase/client");
  });

  it("keeps docs aligned with the scoped public password update rate limit boundary", () => {
    for (const source of [contract, rateLimitPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("auth.password_update.submit");
      expect(source).toContain("password update rate limit runtime");
    }

    expect(contract).toContain("no auth audit runtime");
    expect(rateLimitPlan).toContain("public-auth");
    expect(roadmap).toContain("sem audit runtime");
    expect(liveStatus).toContain("sem audit runtime");
    expect(gapRegister).toContain("sem audit runtime");
  });
});
