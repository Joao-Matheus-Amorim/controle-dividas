import { describe, expect, it } from "vitest";

import {
  aiFinanceClassifierIntents,
  classifyAiFinanceIntent,
} from "@/lib/finance/ai-finance-intent-classifier";

describe("AI finance intent classifier", () => {
  it("keeps classifier intents explicit and includes non-write outcomes", () => {
    expect(aiFinanceClassifierIntents).toEqual([
      "gasto",
      "conta_a_pagar",
      "conta_a_receber",
      "banco",
      "pergunta",
      "recusa",
    ]);
  });

  it("detects expense input without saving anything", () => {
    const result = classifyAiFinanceIntent("paguei mercado 83 no cartao itau ontem");

    expect(result.intent).toBe("gasto");
    expect(result.reviewOnly).toBe(true);
    expect(result.canAutoSave).toBe(false);
    expect(result.directSaveAction).toBeNull();
  });

  it("detects payable input", () => {
    const result = classifyAiFinanceIntent("boleto da internet vence amanha 120 para pagar");

    expect(result.intent).toBe("conta_a_pagar");
    expect(result.matchedTerms).toContain("boleto");
  });

  it("detects receivable input", () => {
    const result = classifyAiFinanceIntent("cliente pagou 500 e vai cair amanha");

    expect(result.intent).toBe("conta_a_receber");
  });

  it("detects bank setup input", () => {
    const result = classifyAiFinanceIntent("cadastrar banco wise com saldo inicial 20 euros");

    expect(result.intent).toBe("banco");
  });

  it("routes financial questions to read-only question outcome", () => {
    const result = classifyAiFinanceIntent("quanto tenho que pagar esse mes?");

    expect(result.intent).toBe("pergunta");
    expect(result.reason).toContain("read-only");
  });

  it("refuses destructive or direct execution requests", () => {
    const result = classifyAiFinanceIntent("apague a conta de luz vencida");

    expect(result.intent).toBe("recusa");
    expect(result.reason).toContain("review-only");
  });
});
