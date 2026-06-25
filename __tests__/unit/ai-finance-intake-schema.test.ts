import { describe, expect, it } from "vitest";

import {
  aiFinanceIntents,
  validateAiFinanceIntakeDraft,
  type AiFinanceIntakeCatalogs,
} from "@/lib/finance/ai-finance-intake-schema";

const catalogs: AiFinanceIntakeCatalogs = {
  members: [{ id: "member-1", name: "Joao" }],
  expenseCategories: [{ id: "category-1", name: "Alimentacao" }],
  receivableSources: [{ id: "source-1", name: "Salario" }],
  bankAccounts: [
    { id: "bank-1", name: "Itau", familyMemberId: "member-1" },
    { id: "bank-2", name: "Wise", familyMemberId: "member-2" },
  ],
  bankNames: ["Itau", "Wise"],
  accountTypes: ["Conta digital", "Conta corrente"],
  currencies: ["EUR", "BRL", "USD"],
};

describe("AI finance intake schema", () => {
  it("keeps the allowed intents explicit", () => {
    expect(aiFinanceIntents).toEqual([
      "gasto",
      "conta_a_pagar",
      "conta_a_receber",
      "banco",
    ]);
  });

  it("accepts a review-only expense draft when ids exist in organization catalogs", () => {
    const result = validateAiFinanceIntakeDraft({
      intent: "gasto",
      memberId: "member-1",
      categoryId: "category-1",
      amount: 83,
      date: "2026-06-25",
      description: "Mercado",
      bankId: "bank-1",
    }, catalogs);

    expect(result.ok).toBe(true);
  });

  it("rejects ids that are not in active organization catalogs", () => {
    const result = validateAiFinanceIntakeDraft({
      intent: "gasto",
      memberId: "member-2",
      categoryId: "category-2",
      amount: 83,
      date: "2026-06-25",
      description: "Mercado",
      bankId: "bank-3",
    }, catalogs);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("memberId is not in the active organization catalog");
    expect(result.errors).toContain("categoryId is not in the active organization catalog");
    expect(result.errors).toContain("bankId is not in the active organization bank catalog");
  });

  it("rejects a bank account that belongs to another member", () => {
    const result = validateAiFinanceIntakeDraft({
      intent: "gasto",
      memberId: "member-1",
      categoryId: "category-1",
      amount: 83,
      date: "2026-06-25",
      description: "Mercado",
      bankId: "bank-2",
    }, catalogs);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("bankId does not belong to the selected member");
  });

  it("requires payable status and type instead of silently defaulting", () => {
    const result = validateAiFinanceIntakeDraft({
      intent: "conta_a_pagar",
      memberId: "member-1",
      categoryId: "category-1",
      name: "Internet",
      amount: 120,
      dueDate: "2026-06-30",
    }, catalogs);

    expect(result.ok).toBe(false);
    expect(result.missingFields).toContain("status");
    expect(result.missingFields).toContain("billType");
  });

  it("requires receivable source from the active organization catalog", () => {
    const result = validateAiFinanceIntakeDraft({
      intent: "conta_a_receber",
      memberId: "member-1",
      sourceId: "source-2",
      amount: 500,
      expectedDate: "2026-06-30",
      status: "previsto",
      incomeType: "variavel",
    }, catalogs);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("sourceId is not in the active organization catalog");
  });

  it("allows negative bank balances but requires ISO currency tokens", () => {
    const validBank = validateAiFinanceIntakeDraft({
      intent: "banco",
      memberId: "member-1",
      bankName: "Wise",
      accountType: "Conta digital",
      currentBalance: -12.5,
      currency: "EUR",
    }, catalogs);

    const invalidCurrency = validateAiFinanceIntakeDraft({
      intent: "banco",
      memberId: "member-1",
      bankName: "Wise",
      accountType: "Conta digital",
      currentBalance: -12.5,
      currency: "euro",
    }, catalogs);

    expect(validBank.ok).toBe(true);
    expect(invalidCurrency.ok).toBe(false);
    expect(invalidCurrency.errors).toContain("currency must be an ISO 4217 token");
  });

  it("rejects bank names and account types outside controlled catalogs", () => {
    const result = validateAiFinanceIntakeDraft({
      intent: "banco",
      memberId: "member-1",
      bankName: "Banco inventado",
      accountType: "Tipo inventado",
      currentBalance: 10,
      currency: "EUR",
    }, catalogs);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("bankName is not in the allowed bank catalog");
    expect(result.errors).toContain("accountType is not in the allowed account type catalog");
  });

  it("rejects unknown intents before any model runtime can save data", () => {
    const result = validateAiFinanceIntakeDraft({
      intent: "transferencia",
      amount: 100,
    }, catalogs);

    expect(result.ok).toBe(false);
    expect(result.draft).toBeNull();
    expect(result.missingFields).toContain("intent");
  });
});
