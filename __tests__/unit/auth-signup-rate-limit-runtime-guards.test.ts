import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("auth signup rate limit runtime guards", () => {
  const signupActions = read("app/auth/sign-up/actions.ts");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("rate limits the public signup authorization email check before profile lookup", () => {
    expect(signupActions).toContain("checksensitiveoperationratelimit");
    expect(signupActions).toContain('operationkey: "auth.signup.authorized_email.check"');
    expect(signupActions).toContain("const normalizedemail");
    expect(signupActions).toContain("normalizeauthorizedemail");
    expect(signupActions).toContain('typeof email === "string" ? email : null');
    expect(signupActions).toContain('actorkey: normalizedemail || "missing-email"');
    expect(signupActions).toContain('organizationid: "public-auth"');
    expect(signupActions).toContain("limit: 10");
    expect(signupActions).toContain("windowms: 10 * 60 * 1000");
    expect(signupActions.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      signupActions.indexOf("lookup = await findauthorizedprofilesbyemail"),
    );
    expect(signupActions).toContain("muitas tentativas de validacao de email");
  });

  it("keeps docs aligned with the scoped public auth rate limit boundary", () => {
    for (const source of [contract, rateLimitPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("auth.signup.authorized_email.check");
      expect(source).toContain("signup authorized email rate limit runtime");
    }

    expect(contract).toContain("no auth audit runtime");
    expect(rateLimitPlan).toContain("public-auth");
    expect(roadmap).toContain("sem audit runtime");
    expect(liveStatus).toContain("sem audit runtime");
    expect(gapRegister).toContain("sem audit runtime");
  });
});
