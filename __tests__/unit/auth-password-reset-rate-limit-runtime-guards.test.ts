import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("auth password reset rate limit runtime guards", () => {
  const resetActions = read("app/auth/forgot-password/actions.ts");
  const resetForm = read("components/forgot-password-form.tsx");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("rate limits password reset requests server-side before Supabase reset", () => {
    expect(resetActions).toContain("checksensitiveoperationratelimit");
    expect(resetActions).toContain('operationkey: "auth.password_reset.request"');
    expect(resetActions).toContain("const normalizedemail");
    expect(resetActions).toContain("normalizeauthorizedemail");
    expect(resetActions).toContain('typeof email === "string" ? email : null');
    expect(resetActions).toContain("isvalidpasswordresetemail");
    expect(resetActions).toContain("getpasswordresetratelimitactorkey");
    expect(resetActions).toContain('"missing-email"');
    expect(resetActions).toContain('"invalid-email"');
    expect(resetActions).toContain("informe um email valido");
    expect(resetActions).toContain('organizationid: "public-auth"');
    expect(resetActions).toContain("limit: 10");
    expect(resetActions).toContain("windowms: 10 * 60 * 1000");
    expect(resetActions.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      resetActions.indexOf("resetpasswordforemail"),
    );
    expect(resetActions.indexOf("if (!isvalidpasswordresetemail(normalizedemail))")).toBeLessThan(
      resetActions.indexOf("resetpasswordforemail"),
    );
    expect(resetActions).toContain("muitas tentativas de recuperacao de senha");
  });

  it("keeps the forgot password form behind the server action boundary", () => {
    expect(resetForm).toContain("requestpasswordreset");
    expect(resetForm).not.toContain("resetpasswordforemail");
    expect(resetForm).not.toContain("@/lib/supabase/client");
  });

  it("keeps docs aligned with the scoped public password reset rate limit boundary", () => {
    for (const source of [contract, rateLimitPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("auth.password_reset.request");
      expect(source).toContain("password reset rate limit runtime");
    }

    expect(contract).toContain("no auth audit runtime");
    expect(rateLimitPlan).toContain("public-auth");
    expect(roadmap).toContain("sem audit runtime");
    expect(liveStatus).toContain("sem audit runtime");
    expect(gapRegister).toContain("sem audit runtime");
  });
});
