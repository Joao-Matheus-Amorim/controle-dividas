import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("auth signup submit rate limit runtime guards", () => {
  const signupActions = read("app/auth/sign-up/actions.ts");
  const signupForm = read("components/sign-up-form.tsx");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("rate limits signup submit server-side before Supabase sign up", () => {
    expect(signupActions).toContain("createinitialorganizationaccess");
    expect(signupActions).toContain("createauthorizedfamilyaccess");
    expect(signupActions).toContain("checksensitiveoperationratelimit");
    expect(signupActions).toContain('operationkey: "auth.signup.submit"');
    expect(signupActions).toContain("const normalizedemail");
    expect(signupActions).toContain("normalizeauthorizedemail");
    expect(signupActions).toContain('typeof email === "string" ? email : null');
    expect(signupActions).toContain("isvalidsignupemail");
    expect(signupActions).toContain("getsignupratelimitactorkey");
    expect(signupActions).toContain('"missing-email"');
    expect(signupActions).toContain('"invalid-email"');
    expect(signupActions).toContain('organizationid: "public-auth"');
    expect(signupActions).toContain("getauthorizedsignupprofile");
    expect(signupActions).toContain("findauthorizedprofilesbyemail");
    expect(signupActions.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      signupActions.indexOf("signup({"),
    );
    expect(signupActions.indexOf("getauthorizedsignupprofile(normalizedemail)")).toBeLessThan(
      signupActions.indexOf("signup({"),
    );
    expect(signupActions).toContain('return { allowed: true, next: "confirm_email" }');
  });

  it("keeps the signup form behind the server action boundary", () => {
    expect(signupForm).toContain("createinitialorganizationaccess");
    expect(signupForm).not.toContain("createauthorizedfamilyaccess");
    expect(signupForm).not.toContain("signup({");
    expect(signupForm).not.toContain("@/lib/supabase/client");
  });

  it("keeps docs aligned with the scoped public signup submit rate limit boundary", () => {
    for (const source of [contract, rateLimitPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("auth.signup.submit");
      expect(source).toContain("signup submit rate limit runtime");
    }

    expect(contract).toContain("no auth audit runtime");
    expect(rateLimitPlan).toContain("public-auth");
    expect(roadmap).toContain("sem audit runtime");
    expect(liveStatus).toContain("sem audit runtime");
    expect(gapRegister).toContain("sem audit runtime");
  });
});
