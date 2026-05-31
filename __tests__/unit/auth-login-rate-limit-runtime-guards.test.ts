import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("auth login rate limit runtime guards", () => {
  const loginActions = read("app/auth/login/actions.ts");
  const loginForm = read("components/login-form.tsx");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("rate limits login server-side before Supabase sign in", () => {
    expect(loginActions).toContain("checksensitiveoperationratelimit");
    expect(loginActions).toContain('operationkey: "auth.login.password"');
    expect(loginActions).toContain("const normalizedemail");
    expect(loginActions).toContain("normalizeauthorizedemail");
    expect(loginActions).toContain('typeof email === "string" ? email : null');
    expect(loginActions).toContain("isvalidloginemail");
    expect(loginActions).toContain("getloginratelimitactorkey");
    expect(loginActions).toContain('"missing-email"');
    expect(loginActions).toContain('"invalid-email"');
    expect(loginActions).toContain('organizationid: "public-auth"');
    expect(loginActions).toContain("limit: 10");
    expect(loginActions).toContain("windowms: 10 * 60 * 1000");
    expect(loginActions.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      loginActions.indexOf("signinwithpassword"),
    );
    expect(loginActions.indexOf("if (!isvalidloginemail(normalizedemail))")).toBeLessThan(
      loginActions.indexOf("signinwithpassword"),
    );
    expect(loginActions).toContain("muitas tentativas de entrada");
  });

  it("keeps the login form behind the server action boundary", () => {
    expect(loginForm).toContain("loginwithpassword");
    expect(loginForm).not.toContain("signinwithpassword");
    expect(loginForm).not.toContain("@/lib/supabase/client");
  });

  it("keeps docs aligned with the scoped public login rate limit boundary", () => {
    for (const source of [contract, rateLimitPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("auth.login.password");
      expect(source).toContain("login rate limit runtime");
    }

    expect(contract).toContain("no auth audit runtime");
    expect(rateLimitPlan).toContain("public-auth");
    expect(roadmap).toContain("sem audit runtime");
    expect(liveStatus).toContain("sem audit runtime");
    expect(gapRegister).toContain("sem audit runtime");
  });
});
