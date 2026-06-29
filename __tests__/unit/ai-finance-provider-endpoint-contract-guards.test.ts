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

  it("documents provider and endpoint work as pre-runtime only", () => {
    expect(contract).toContain("status docdoc: atual");
    expect(contract).toContain("contrato pre-runtime");
    expect(contract).toContain("endpoint read-only inicial");
    expect(contract).toContain("endpoint model-backed futuro");
    expect(contract).toContain("model-backed de geracao de rascunho");
    expect(contract).toContain("roadmap vivo da feature completa");
    expect(contract).toContain("chave de api");
    expect(contract).toContain("salvamento automatico");
  });

  it("requires the existing review-only server and UI boundaries first", () => {
    expect(contract).toContain("lib/finance/ai-finance-intake-runtime.ts");
    expect(contract).toContain("components/finance/assisted-draft-review-boundary.tsx");
    expect(contract).toContain("docs/audits/ai_finance_intake_contract.md");
    expect(compactContract).toContain("resposta `review_only`");
    expect(compactContract).toContain("sem `formaction`, sem `type=\"submit\"`");
  });

  it("keeps future provider runtime fail-closed and server-only", () => {
    expect(contract).toContain("falhar fechado");
    expect(contract).toContain("apenas no servidor");
    expect(contract).toContain("nenhuma chave pode ser lida no client");
    expect(contract).toContain("rollback por feature flag server-side");
    expect(contract).toContain("guard de dependencia");
  });

  it("blocks direct save behavior from any future endpoint", () => {
    expect(contract).toContain("buildaifinancereviewonlyboundary");
    expect(contract).toContain("createreceivableincome");
    expect(contract).toContain("createbankaccount");
    expect(contract).toContain("nunca retornar `canautosave: true`");
    expect(contract).toContain("`directsaveaction` diferente de `null`");
  });

  it("requires rate limit and audit without raw prompt retention", () => {
    expect(contract).toContain("rate limit dedicado");
    expect(contract).toContain("actor, organizacao e target");
    expect(contract).toContain("sem prompt bruto");
    expect(contract).toContain("erro para limite excedido");
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
