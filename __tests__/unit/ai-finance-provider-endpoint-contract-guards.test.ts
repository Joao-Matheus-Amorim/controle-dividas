import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

function compact(value: string) {
  return value.replace(/\s+/g, " ");
}

describe("AI finance provider endpoint contract guards", () => {
  const contract = read("docs/audits/AI_FINANCE_PROVIDER_ENDPOINT_CONTRACT.md");
  const compactContract = compact(contract);
  const intakeContract = read("docs/audits/AI_FINANCE_INTAKE_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const packageJson = read("package.json");

  it("documents provider and endpoint runtime implementation", () => {
    expect(contract).toContain("status docdoc: atual");
    expect(contract).toContain("provider runtime implementado");
    expect(contract).toContain("endpoint read-only inicial");
    expect(contract).toContain("getcategoryspendingsummary");
    expect(contract).toContain("getmemberlimitssummary");
    expect(contract).toContain("endpoint model-backed");
    expect(contract).toContain("classifyaifinanceintent");
    expect(contract).toContain("roadmap vivo da feature completa");
    expect(contract).toContain("chave de api");
    expect(contract).toContain("salvamento automatico");
  });

  it("requires the existing review-only server and UI boundaries maintained", () => {
    expect(contract).toContain("lib/finance/ai-finance-intake-runtime.ts");
    expect(contract).toContain("components/finance/assisted-draft-review-boundary.tsx");
    expect(contract).toContain("docs/audits/ai_finance_intake_contract.md");
    expect(contract).toContain("lib/ai/provider/");
    expect(contract).toContain("lib/ai/rate-limiter.ts");
    expect(contract).toContain("/api/ai/chat");
  });

  it("keeps provider runtime fail-closed and server-only", () => {
    expect(contract).toContain("falhar fechado");
    expect(contract).toContain("apenas no servidor");
    expect(contract).toContain("nenhuma chave pode ser lida no client");
    expect(contract).toContain("rollback por feature flag server-side");
    expect(contract).toContain("guard de dependencia");
  });

  it("blocks direct save behavior from the model-backed endpoint", () => {
    expect(contract).toContain("createreceivableincome");
    expect(contract).toContain("createbankaccount");
    expect(contract).toContain("nunca retorna dados que permitam salvamento direto");
    expect(contract).toContain("salvamento automatico");
  });

  it("implements rate limit, audit and short-lived conversation retention", () => {
    expect(contract).toContain("rate limit dedicado");
    expect(contract).toContain("20 requisicoes por minuto");
    expect(contract).toContain("ai_conversations");
    expect(contract).toContain("expires_at");
    expect(contract).toContain("24 horas");
    expect(contract).toContain("retryafterms");
  });

  it("registers the provider endpoint contract in living docs", () => {
    expect(intakeContract).toContain("ai_finance_provider_endpoint_contract.md");
    expect(gapRegister).toContain("ai_finance_provider_endpoint_contract.md");
    expect(auditsReadme).toContain("ai_finance_provider_endpoint_contract.md");
    expect(statusMap).toContain("ai_finance_provider_endpoint_contract.md");
    expect(roadmap).toContain("ai_finance_provider_endpoint_contract.md");
  });

  it("keeps this contract PR free of AI provider dependencies", () => {
    expect(packageJson).not.toContain("\"openai\"");
    expect(packageJson).not.toContain("\"@ai-sdk/openai\"");
    expect(packageJson).not.toContain("\"ai\"");
    expect(packageJson).not.toContain("\"@anthropic-ai/sdk\"");
    expect(packageJson).not.toContain("\"@google/generative-ai\"");
  });
});
