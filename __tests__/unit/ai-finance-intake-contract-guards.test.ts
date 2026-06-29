import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

function compact(value: string) {
  return value.replace(/\s+/g, " ");
}

describe("AI finance intake contract guards", () => {
  const contract = read("docs/audits/AI_FINANCE_INTAKE_CONTRACT.md");
  const compactContract = compact(contract);
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const packageJson = read("package.json");

  it("documents AI finance intake as a pre-runtime contract", () => {
    expect(contract).toContain("status docdoc: atual");
    expect(contract).toContain("contrato vigente");
    expect(contract).toContain("fronteira server-only review-only");
    expect(contract).toContain("nao e evidencia de modelo");
    expect(contract).toContain("endpoint");
    expect(contract).toContain("provider");
    expect(contract).toContain("salvamento automatico");
  });

  it("records the current deterministic assisted-draft code surface", () => {
    expect(contract).toContain("estado atual no codigo");
    expect(contract).toContain("lib/finance/expense-draft.ts");
    expect(contract).toContain("lib/finance/payable-draft.ts");
    expect(contract).toContain("lib/finance/receivable-draft.ts");
    expect(contract).toContain("lib/finance/bank-draft.ts");
    expect(contract).toContain("lib/finance/ai-finance-intake-schema.ts");
    expect(contract).toContain("lib/finance/ai-finance-intake-catalogs.ts");
    expect(contract).toContain("lib/finance/ai-finance-intake-runtime.ts");
    expect(contract).toContain("components/finance/assisted-draft-review-boundary.tsx");
    expect(contract).toContain("components/finance/expense-form.tsx");
    expect(contract).toContain("formaction");
    expect(contract).toContain("review-only");
    expect(compactContract).toContain("ainda nao esta pronto para provider, endpoint model-backed de rascunho ou chamada de modelo");
  });

  it("limits model intents to the finance create surfaces", () => {
    expect(contract).toContain("gasto");
    expect(contract).toContain("conta_a_pagar");
    expect(contract).toContain("conta_a_receber");
    expect(contract).toContain("banco");
    expect(contract).toContain("qualquer pedido fora dessas intents");
  });

  it("keeps model output review-only and disconnected from direct writes", () => {
    expect(contract).toContain("review-only");
    expect(contract).toContain("nunca chamar `createexpense`");
    expect(compactContract).toContain("nunca chamar `createexpense`, `createpayablebill`, `createreceivableincome` ou `createbankaccount`");
    expect(contract).toContain("nunca inventar ids");
  });

  it("requires organization catalogs and linked-member scoping", () => {
    expect(contract).toContain("catalogo real da organizacao");
    expect(contract).toContain("20 categorias raiz");
    expect(contract).toContain("transferencias");
    expect(compactContract).toContain("nao deve entrar em total de gastos reportavel");
    expect(contract).toContain("pessoa vinculada ao usuario logado");
    expect(contract).toContain("para owner/admin");
    expect(compactContract).toContain("se ela existir na organizacao ativa");
  });

  it("requires follow-up questions for missing or ambiguous required fields", () => {
    expect(contract).toContain("perguntas obrigatorias");
    expect(contract).toContain("categoria de gasto ou conta a pagar");
    expect(contract).toContain("origem de recebimento");
    expect(contract).toContain("banco/cartao mencionado mas ambiguo");
    expect(contract).toContain("qual descricao voce");
    expect(contract).toContain("nao encontrei um banco ou cartao itau");
  });

  it("registers GAP-020 in the living documentation map", () => {
    expect(gapRegister).toContain("gap-020");
    expect(gapRegister).toContain("ai finance intake");
    expect(gapRegister).toContain("docs/audits/ai_finance_intake_contract.md");
    expect(gapRegister).toContain("lib/finance/ai-finance-intake-schema.ts");
    expect(gapRegister).toContain("lib/finance/ai-finance-intake-catalogs.ts");
    expect(gapRegister).toContain("lib/finance/ai-finance-intake-runtime.ts");
    expect(gapRegister).toContain("components/finance/assisted-draft-review-boundary.tsx");
    expect(auditsReadme).toContain("ai_finance_intake_contract.md");
    expect(statusMap).toContain("ai_finance_intake_contract.md");
    expect(roadmap).toContain("gap-020 - ia financeira");
    expect(roadmap).toContain("lib/finance/ai-finance-intake-schema.ts");
    expect(roadmap).toContain("lib/finance/ai-finance-intake-catalogs.ts");
    expect(roadmap).toContain("lib/finance/ai-finance-intake-runtime.ts");
    expect(roadmap).toContain("components/finance/assisted-draft-review-boundary.tsx");
  });

  it("keeps this contract PR free of AI provider runtime dependencies", () => {
    expect(packageJson).not.toContain("\"openai\"");
    expect(packageJson).not.toContain("\"@ai-sdk/openai\"");
    expect(packageJson).not.toContain("\"ai\"");
    expect(packageJson).not.toContain("\"@anthropic-ai/sdk\"");
    expect(packageJson).not.toContain("\"@google/generative-ai\"");
  });
});
