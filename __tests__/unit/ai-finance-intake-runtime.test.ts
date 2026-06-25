import { describe, expect, it, vi } from "vitest";

import { buildAiFinanceReviewOnlyBoundary } from "@/lib/finance/ai-finance-intake-runtime";
import type { AiFinanceIntakeCatalogs } from "@/lib/finance/ai-finance-intake-schema";

vi.mock("server-only", () => ({}));

const catalogs: AiFinanceIntakeCatalogs = {
  members: [{ id: "member-1", name: "Joao" }],
  expenseCategories: [{ id: "category-1", name: "Alimentacao" }],
  receivableSources: [{ id: "source-1", name: "Salario" }],
  bankAccounts: [{ id: "bank-1", name: "Itau - Conta corrente", familyMemberId: "member-1" }],
  bankNames: ["Itau", "Wise"],
  accountTypes: ["Conta corrente", "Conta digital"],
  currencies: ["EUR", "BRL", "USD"],
};

vi.mock("@/lib/finance/ai-finance-intake-catalogs", () => ({
  getAiFinanceIntakeCatalogs: vi.fn(async () => catalogs),
}));

describe("AI finance intake review-only runtime", () => {
  it("returns a review-only boundary for a valid draft", async () => {
    const result = await buildAiFinanceReviewOnlyBoundary({
      intent: "gasto",
      orgSlug: "familia",
      draft: {
        intent: "gasto",
        memberId: "member-1",
        categoryId: "category-1",
        amount: 83,
        date: "2026-06-25",
        description: "Mercado",
        bankId: "bank-1",
      },
    });

    expect(result.mode).toBe("review_only");
    expect(result.intent).toBe("gasto");
    expect(result.provider).toBe("none");
    expect(result.reviewRequired).toBe(true);
    expect(result.canAutoSave).toBe(false);
    expect(result.directSaveAction).toBeNull();
    expect(result.validation.ok).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.catalogs.members).toEqual([{ id: "member-1", name: "Joao" }]);
  });

  it("keeps invalid catalog ids review-only and exposes validation errors", async () => {
    const result = await buildAiFinanceReviewOnlyBoundary({
      intent: "gasto",
      draft: {
        intent: "gasto",
        memberId: "member-2",
        categoryId: "category-2",
        amount: 83,
        date: "2026-06-25",
        description: "Mercado",
        bankId: "bank-2",
      },
    });

    expect(result.mode).toBe("review_only");
    expect(result.provider).toBe("none");
    expect(result.canAutoSave).toBe(false);
    expect(result.directSaveAction).toBeNull();
    expect(result.validation.ok).toBe(false);
    expect(result.errors).toContain("memberId is not in the active organization catalog");
    expect(result.errors).toContain("categoryId is not in the active organization catalog");
    expect(result.errors).toContain("bankId is not in the active organization bank catalog");
  });
});
