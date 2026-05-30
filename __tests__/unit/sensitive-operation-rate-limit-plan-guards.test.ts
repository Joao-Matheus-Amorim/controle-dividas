import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("sensitive operation rate limit plan guards", () => {
  const plan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("documents the current checkout and expense delete rate limit runtime without broadening scope", () => {
    expect(plan).toContain("gap-015");
    expect(plan).toContain("billing checkout rate limit runtime exists");
    expect(plan).toContain("billing.checkout.start");
    expect(plan).toContain("expense delete rate limit runtime exists");
    expect(plan).toContain("finance.expense.delete");
    expect(plan).toContain("payable delete rate limit runtime exists");
    expect(plan).toContain("finance.payable.delete");
    expect(plan).toContain("payable status rate limit runtime exists");
    expect(plan).toContain("finance.payable.status.update");
    expect(plan).toContain("receivable delete rate limit runtime exists");
    expect(plan).toContain("finance.receivable.delete");
    expect(plan).toContain("receivable status rate limit runtime exists");
    expect(plan).toContain("finance.receivable.status.update");
    expect(plan).toContain("bank delete rate limit runtime exists");
    expect(plan).toContain("finance.bank.delete");
    expect(plan).toContain("bank balance rate limit runtime exists");
    expect(plan).toContain("finance.bank.balance.update");
    expect(plan).toContain("member limit rate limit runtime exists");
    expect(plan).toContain("finance.member.limit.update");
    expect(plan).toContain("category delete rate limit runtime exists");
    expect(plan).toContain("finance.category.delete");
    expect(plan).toContain("admin permission rate limit runtime exists");
    expect(plan).toContain("admin.permission.update");
    expect(plan).toContain("admin.feature_permission.update");
    expect(plan).toContain("admin user rate limit runtime exists");
    expect(plan).toContain("admin.user.create");
    expect(plan).toContain("admin.user.update");
    expect(plan).toContain("admin.user.auth_link.sync");
    expect(plan).toContain("admin.user.delete");
    expect(plan).toContain("admin.user.status.update");
    expect(plan).toContain("process-local memory");
    expect(plan).toContain("disable_sensitive_rate_limits=true");
    expect(plan).toContain("no middleware change");
    expect(plan).toContain("no schema change");
    expect(plan).toContain("no rls change");
    expect(plan).toContain("no e2e change");
    expect(plan).toContain("broader or public-auth limits still need a durable/cache-backed storage decision");
  });

  it("defines required rate limit implementation decisions", () => {
    for (const decision of [
      "operation key",
      "actor key",
      "organization key",
      "target key",
      "window",
      "threshold",
      "response",
      "storage",
      "bypass",
      "rollback",
    ]) {
      expect(plan).toContain(decision);
    }

    expect(plan).toContain("must run on the server boundary");
    expect(plan).toContain("client-only throttling is not a gap-015 control");
  });

  it("protects key design, operation tiers, and storage decisions", () => {
    expect(plan).toContain("billing.checkout.start");
    expect(plan).toContain("finance.expense.delete");
    expect(plan).toContain("finance.payable.delete");
    expect(plan).toContain("finance.payable.status.update");
    expect(plan).toContain("finance.receivable.delete");
    expect(plan).toContain("finance.receivable.status.update");
    expect(plan).toContain("finance.bank.delete");
    expect(plan).toContain("finance.bank.balance.update");
    expect(plan).toContain("finance.member.limit.update");
    expect(plan).toContain("finance.category.delete");
    expect(plan).toContain("admin.permission.update");
    expect(plan).toContain("admin.feature_permission.update");
    expect(plan).toContain("admin.user.create");
    expect(plan).toContain("admin.user.status.update");
    expect(plan).toContain("admin mutations");
    expect(plan).toContain("destructive finance actions");
    expect(plan).toContain("rate_limit:{operation_key}:{actor_key}:{organization_key}:{target_key?}");
    expect(plan).toContain("never trust `organization_id` supplied by the client");
    expect(plan).toContain("database table");
    expect(plan).toContain("external cache");
    expect(plan).toContain("platform limiter");
    expect(plan).toContain("the first runtime limiter uses process-local memory");
  });

  it("keeps live docs aligned with the rate limit plan", () => {
    for (const source of [contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("docs/audits/sensitive_operation_rate_limit_plan.md");
      expect(source).toContain("rate limit");
    }

    expect(contract).toContain("when changing rate limit behavior");
    expect(roadmap).toContain("plano de rate limiting");
    expect(liveStatus).toContain("plano de rate limiting");
    expect(gapRegister).toContain("rate limit planning exists");
    expect(gapRegister).toContain("billing checkout rate limit runtime");
    expect(gapRegister).toContain("expense delete rate limit runtime");
    expect(gapRegister).toContain("payable delete rate limit runtime");
    expect(gapRegister).toContain("payable status rate limit runtime");
    expect(gapRegister).toContain("receivable delete rate limit runtime");
    expect(gapRegister).toContain("receivable status rate limit runtime");
    expect(gapRegister).toContain("bank delete rate limit runtime");
    expect(gapRegister).toContain("bank balance rate limit runtime");
    expect(gapRegister).toContain("member limit rate limit runtime");
    expect(gapRegister).toContain("category delete rate limit runtime");
    expect(gapRegister).toContain("admin permission rate limit runtime");
    expect(gapRegister).toContain("admin user rate limit runtime");
    expect(gapRegister).toContain("remaining broader rate limiting and data retention cleanup runtime controls are not implemented");
  });
});
