import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const assistedDraftForms = [
  "components/finance/expense-form.tsx",
  "components/finance/payable-bill-form.tsx",
  "components/finance/receivable-income-form.tsx",
  "components/finance/bank-account-form.tsx",
];

const draftHelpers = [
  "lib/finance/expense-draft.ts",
  "lib/finance/payable-draft.ts",
  "lib/finance/receivable-draft.ts",
  "lib/finance/bank-draft.ts",
];

describe("finance assisted draft contract guards", () => {
  it("keeps assisted drafts review-only and available only on create forms", () => {
    for (const formPath of assistedDraftForms) {
      const source = readSource(formPath);

      expect(source).toContain("Rascunho assistido");
      expect(source).toContain("!isEditing ? (");
      expect(source).toContain('type="button"');
      expect(source).toContain("onClick={applyDraftSuggestion}");
      expect(source).toContain("disabled={!draftPrompt.trim()}");
      expect(source).toContain("setDraftApplied(true)");
    }
  });

  it("keeps assisted draft suggestions out of server action write paths", () => {
    for (const formPath of assistedDraftForms) {
      const source = readSource(formPath);
      const applyDraftStart = source.indexOf("function applyDraftSuggestion()");
      const returnStart = source.indexOf("return (", applyDraftStart);
      const applyDraftBody = source.slice(applyDraftStart, returnStart);

      expect(applyDraftStart).toBeGreaterThanOrEqual(0);
      expect(applyDraftBody).not.toContain("formAction");
      expect(applyDraftBody).not.toContain("createExpense");
      expect(applyDraftBody).not.toContain("createPayableBill");
      expect(applyDraftBody).not.toContain("createReceivableIncome");
      expect(applyDraftBody).not.toContain("createBankAccount");
    }
  });

  it("keeps all draft helpers on the shared parser and review note", () => {
    const utilities = readSource("lib/finance/finance-draft-utils.ts");

    expect(utilities).toContain("financeDraftReviewNote");
    expect(utilities).toContain("normalizeFinanceDraftText");
    expect(utilities).toContain("cleanFinanceDraftText");
    expect(utilities).toContain("parseFinanceDraftDate");
    expect(utilities).toContain("findFinanceDraftBankByName");

    for (const helperPath of draftHelpers) {
      const source = readSource(helperPath);

      expect(source).toContain("@/lib/finance/finance-draft-utils");
      expect(source).toContain("financeDraftReviewNote");
      expect(source).not.toContain('"Rascunho assistido; confira antes de cadastrar."');
    }
  });

  it("keeps future payable and receivable intent from being marked paid automatically", () => {
    const payableDraft = readSource("lib/finance/payable-draft.ts");
    const receivableDraft = readSource("lib/finance/receivable-draft.ts");
    const payableContract = readSource("__tests__/unit/payable-draft.test.ts");
    const receivableContract = readSource("__tests__/unit/receivable-draft.test.ts");

    expect(payableDraft).toContain("\\b(?:pago|paga|paguei)\\b");
    expect(payableDraft).not.toContain('includes("paga")');
    expect(payableContract).toContain("para pagar amanha");
    expect(payableContract).toContain('expect(draft.status).toBe("pendente")');

    expect(receivableDraft).toContain("\\b(?:recebi|recebido|recebida|caiu)\\b");
    expect(receivableDraft).not.toContain('includes("recebi")');
    expect(receivableContract).toContain("para receber amanha");
    expect(receivableContract).toContain('expect(draft.status).toBe("previsto")');
  });
});
