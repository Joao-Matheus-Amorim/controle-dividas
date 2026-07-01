import { describe, expect, it } from "vitest";

import { buildAiFinanceUniversalDraft } from "@/lib/finance/ai-finance-universal-draft";
import type { DbBankAccount, DbExpenseCategory, DbReceivableIncomeSource } from "@/lib/finance/types";

const categories: DbExpenseCategory[] = [
  {
    id: "cat-alimentacao",
    owner_id: "owner-1",
    parent_category_id: null,
    name: "Alimentacao",
    description: null,
    is_default: true,
    created_at: "2026-06-28",
  },
];

const bankAccounts: DbBankAccount[] = [
  {
    id: "bank-itau",
    owner_id: "owner-1",
    family_member_id: "member-1",
    bank_name: "Itau",
    account_type: "Cartao de credito",
    current_balance: 0,
    currency: "BRL",
    notes: null,
    created_at: "2026-06-28",
    family_members: null,
  },
];

const sources: DbReceivableIncomeSource[] = [
  {
    id: "source-freelance",
    owner_id: "owner-1",
    name: "Freelance",
    description: null,
    is_default: true,
    created_at: "2026-06-28",
  },
];

describe("AI finance universal draft", () => {
  it("builds an expense draft boundary without allowing direct saves", () => {
    const result = buildAiFinanceUniversalDraft({
      text: "paguei mercado 83 no cartao itau ontem",
      today: "2026-06-28",
      catalogs: { expenseCategories: categories, bankAccounts },
    });

    expect(result.mode).toBe("review_only");
    expect(result.canAutoSave).toBe(false);
    expect(result.directSaveAction).toBeNull();
    expect(result.draft?.intent).toBe("gasto");
  });

  it("builds payable, receivable and bank draft boundaries", () => {
    expect(buildAiFinanceUniversalDraft({
      text: "boleto da internet vence amanha 120 para pagar",
      today: "2026-06-28",
      catalogs: { expenseCategories: categories, bankAccounts },
    }).draft?.intent).toBe("conta_a_pagar");

    expect(buildAiFinanceUniversalDraft({
      text: "cliente pagou freelance 500 vai cair amanha",
      today: "2026-06-28",
      catalogs: { receivableSources: sources, bankAccounts },
    }).draft?.intent).toBe("conta_a_receber");

    expect(buildAiFinanceUniversalDraft({
      text: "cadastrar banco wise conta digital saldo inicial 20 eur",
      today: "2026-06-28",
    }).draft?.intent).toBe("banco");
  });

  it("does not turn questions or refusals into saveable drafts", () => {
    const question = buildAiFinanceUniversalDraft({
      text: "quanto tenho que pagar esse mes?",
      today: "2026-06-28",
    });
    const refusal = buildAiFinanceUniversalDraft({
      text: "transferir dinheiro",
      today: "2026-06-28",
    });

    expect(question.draft).toBeNull();
    expect(refusal.draft).toBeNull();
    expect(question.canAutoSave).toBe(false);
    expect(refusal.directSaveAction).toBeNull();
  });
});
