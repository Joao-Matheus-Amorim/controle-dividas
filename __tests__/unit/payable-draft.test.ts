import { describe, expect, it } from "vitest";

import { buildPayableBillDraftSuggestion } from "@/lib/finance/payable-draft";
import type { DbBankAccount, DbExpenseCategory } from "@/lib/finance/types";

const categories = [
  { id: "cat-utilities", name: "Utilidades", parent_category_id: null },
  { id: "cat-food", name: "Alimentacao", parent_category_id: null },
] as DbExpenseCategory[];

const bankAccounts = [
  { id: "bank-itau-checking", bank_name: "Itau", account_type: "Conta corrente" },
  { id: "bank-itau-card", bank_name: "Itau", account_type: "Cartao de credito" },
  { id: "bank-wise", bank_name: "Wise", account_type: "Conta" },
] as DbBankAccount[];

describe("payable bill draft suggestion", () => {
  it("builds a payable draft with category, due date, status, and bank", () => {
    const draft = buildPayableBillDraftSuggestion(
      "Conta de luz 120 no cartao itau paga amanha",
      categories,
      bankAccounts,
      "2026-06-18",
    );

    expect(draft).toMatchObject({
      amount: "120",
      bankUsed: "Itau",
      billType: "avulsa",
      category: "Utilidades",
      dueDate: "2026-06-19",
      status: "pago",
    });
    expect(draft.name).toContain("Conta de luz");
    expect(draft.notes).toContain("confira antes de cadastrar");
  });
});
