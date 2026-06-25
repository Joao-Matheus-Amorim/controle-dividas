import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("AI finance intake runtime boundary guards", () => {
  const source = read("lib/finance/ai-finance-intake-runtime.ts");
  const contract = read("docs/audits/AI_FINANCE_INTAKE_CONTRACT.md").toLowerCase();
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md").toLowerCase();
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md").toLowerCase();

  it("keeps the boundary server-only and catalog-backed", () => {
    expect(source).toContain('import "server-only"');
    expect(source).toContain("getAiFinanceIntakeCatalogs(intent, orgSlug)");
    expect(source).toContain("validateAiFinanceIntakeDraft(draft, catalogs)");
  });

  it("forces model candidates through review-only output", () => {
    expect(source).toContain('mode: "review_only"');
    expect(source).toContain('provider: "none"');
    expect(source).toContain("reviewRequired: true");
    expect(source).toContain("canAutoSave: false");
    expect(source).toContain("directSaveAction: null");
    expect(source).toContain("missingFields");
    expect(source).toContain("errors");
  });

  it("does not introduce provider, endpoint, or direct write behavior", () => {
    expect(source).not.toContain("openai");
    expect(source).not.toContain("@ai-sdk");
    expect(source).not.toContain("generateText");
    expect(source).not.toContain("streamText");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("createExpense");
    expect(source).not.toContain("createPayableBill");
    expect(source).not.toContain("createReceivableIncome");
    expect(source).not.toContain("createBankAccount");
  });

  it("keeps living docs aligned with the runtime boundary", () => {
    expect(contract).toContain("lib/finance/ai-finance-intake-runtime.ts");
    expect(contract).toContain("fronteira server-only review-only");
    expect(contract).toContain("provider: `none`");
    expect(gapRegister).toContain("lib/finance/ai-finance-intake-runtime.ts");
    expect(gapRegister).toContain("review-only");
    expect(roadmap).toContain("lib/finance/ai-finance-intake-runtime.ts");
  });
});
