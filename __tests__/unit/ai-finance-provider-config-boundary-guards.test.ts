import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("AI finance provider configuration boundary guards", () => {
  const helper = read("lib/finance/ai-finance-provider-config.ts");
  const behaviorTest = read("__tests__/unit/ai-finance-provider-config-boundary.test.ts");
  const providerContract = read("docs/audits/AI_FINANCE_PROVIDER_ENDPOINT_CONTRACT.md");
  const intakeContract = read("docs/audits/AI_FINANCE_INTAKE_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const packageJson = read("package.json");

  it("keeps the provider configuration boundary explicit and test-compatible", () => {
    expect(helper).not.toContain('import "server-only"');
    expect(helper).toContain("enable_ai_finance_provider");
    expect(helper).toContain("ai_finance_provider");
    expect(helper).toContain("ai_finance_model");
    expect(helper).toContain("ai_finance_provider_api_key");
    expect(helper).toContain("shouldfailfastformissingruntimeenv");
  });

  it("keeps behavior coverage for fail-closed provider configuration", () => {
    expect(behaviorTest).toContain("stays disabled");
    expect(behaviorTest).toContain("missing server-side provider env");
    expect(behaviorTest).toContain("fails fast in production-like runtime");
    expect(behaviorTest).toContain("enable_ai_finance_provider");
  });

  it("registers the boundary in GAP-020 docs without provider runtime", () => {
    expect(providerContract).toContain("lib/finance/ai-finance-provider-config.ts");
    expect(intakeContract).toContain("lib/finance/ai-finance-provider-config.ts");
    expect(gapRegister).toContain("lib/finance/ai-finance-provider-config.ts");
    expect(roadmap).toContain("lib/finance/ai-finance-provider-config.ts");
  });

  it("keeps this boundary PR free of provider dependencies", () => {
    expect(packageJson).not.toContain("\"openai\"");
    expect(packageJson).not.toContain("\"@ai-sdk/openai\"");
    expect(packageJson).not.toContain("\"ai\"");
    expect(packageJson).not.toContain("\"@anthropic-ai/sdk\"");
    expect(packageJson).not.toContain("\"@google/generative-ai\"");
  });
});
