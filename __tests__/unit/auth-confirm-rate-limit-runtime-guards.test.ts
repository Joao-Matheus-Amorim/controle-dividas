import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("auth confirm rate limit runtime guards", () => {
  const confirmRoute = read("app/auth/confirm/route.ts");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("rate limits the public auth confirm route before OTP verification", () => {
    expect(confirmRoute).toContain("checksensitiveoperationratelimit");
    expect(confirmRoute).toContain('operationkey: "auth.confirm.verify"');
    expect(confirmRoute).toContain("getpublicauthactorkey");
    expect(confirmRoute).toContain('organizationid: "public-auth"');
    expect(confirmRoute).toContain('targetkey: type ?? "missing-type"');
    expect(confirmRoute).toContain("limit: 10");
    expect(confirmRoute).toContain("windowms: 10 * 60 * 1000");
    expect(confirmRoute.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      confirmRoute.indexOf("verifyotp"),
    );
    expect(confirmRoute).toContain("muitas tentativas de confirmacao");
  });

  it("keeps docs aligned with the scoped public auth confirm rate limit boundary", () => {
    for (const source of [contract, rateLimitPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("auth.confirm.verify");
      expect(source).toContain("auth confirm rate limit runtime");
    }

    expect(contract).toContain("no auth audit runtime");
    expect(rateLimitPlan).toContain("public-auth");
    expect(roadmap).toContain("sem audit runtime");
    expect(liveStatus).toContain("sem audit runtime");
    expect(gapRegister).toContain("sem audit runtime");
  });
});
