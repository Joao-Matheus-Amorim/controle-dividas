import { describe, expect, it } from "vitest";

import { buildBankAccountDraftSuggestion } from "@/lib/finance/bank-draft";

describe("bank account draft suggestion", () => {
  it("builds a credit card draft from natural text", () => {
    const draft = buildBankAccountDraftSuggestion("Cartao Itau saldo 500 EUR");

    expect(draft).toMatchObject({
      accountType: "Cartao de credito",
      bankName: "Itau",
      currentBalance: "500",
      currency: "EUR",
    });
    expect(draft.notes).toContain("confira antes de cadastrar");
  });

  it("uses only system bank options for bank names", () => {
    const draft = buildBankAccountDraftSuggestion("Conta Banco Manual saldo 100 BRL");

    expect(draft.bankName).toBe("");
    expect(draft.accountType).toBe("Conta corrente");
    expect(draft.currentBalance).toBe("100");
    expect(draft.currency).toBe("BRL");
  });
});
