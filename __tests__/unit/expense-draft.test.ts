import { describe, expect, it } from "vitest";

import { buildExpenseDraftSuggestion } from "@/lib/finance/expense-draft";
import type { DbBankAccount, DbExpenseCategory } from "@/lib/finance/types";

const categories = [
  { id: "cat-food", name: "Alimentacao", parent_category_id: null },
  { id: "cat-delivery", name: "Alimentacao Fora", parent_category_id: null },
  { id: "cat-work", name: "Trabalho", parent_category_id: null },
] as DbExpenseCategory[];

const bankAccounts = [
  { id: "bank-itau-checking", bank_name: "Itau", account_type: "Conta corrente" },
  { id: "bank-itau-card", bank_name: "Itau", account_type: "Cartao de credito" },
  { id: "bank-wise", bank_name: "Wise", account_type: "Conta" },
] as DbBankAccount[];

describe("expense draft suggestion", () => {
  it("builds a reviewable expense draft from natural text", () => {
    const draft = buildExpenseDraftSuggestion(
      "Comprei 2kg de carne no Carrefour por 23,50 no cartao itau ontem",
      categories,
      bankAccounts,
      "2026-06-18",
    );

    expect(draft).toMatchObject({
      amount: "23.50",
      categoryId: "cat-food",
      expenseDate: "2026-06-17",
      bankId: "bank-itau-card",
      paymentMethod: "Cartao",
      purchaseLocation: "Carrefour",
    });
    expect(draft.description).toContain("Comprei 2kg de carne");
    expect(draft.notes).toContain("confira antes de cadastrar");
  });

  it("uses the taxonomy examples to suggest work expenses", () => {
    const draft = buildExpenseDraftSuggestion(
      "Assinatura ChatGPT 20 eur",
      categories,
      bankAccounts,
      "2026-06-18",
    );

    expect(draft.categoryId).toBe("cat-work");
    expect(draft.amount).toBe("20");
  });
});
