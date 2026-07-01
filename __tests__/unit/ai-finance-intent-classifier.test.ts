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
      "acao_pagamento",
      "pergunta",
      "recusa",
    ]);
  });

  it("detects quick action payment requests", () => {
    const result = classifyAiFinanceIntent("marca a conta de luz como paga");

    expect(result.intent).toBe("acao_pagamento");
    expect(result.matchedTerms).toContain("marca");
  });

  it("detects pague a conta as action, not refusal", () => {
    const result = classifyAiFinanceIntent("pague a conta de internet");

    expect(result.intent).toBe("acao_pagamento");
    expect(result.matchedTerms).toContain("pague a conta");
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

  it("detects delete intent instead of refusal", () => {
    const result = classifyAiFinanceIntent("apague a conta de luz vencida");

    expect(result.intent).toBe("conta_a_pagar");
    expect(result.actionType).toBe("excluir");
  });

  it("refuses non-financial operations like money transfer", () => {
    const result = classifyAiFinanceIntent("transferir dinheiro");

    expect(result.intent).toBe("recusa");
    expect(result.reason).toContain("nao permitido");
  });
});
