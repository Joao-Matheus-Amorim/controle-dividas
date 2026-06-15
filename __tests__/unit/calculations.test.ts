import { describe, expect, it } from "vitest";

import {
  bankAccounts,
  expenseCategories,
  expenses,
  familyMembers,
  payableBills,
  receivableIncomes,
} from "@/__tests__/fixtures/mock-data";
import {
  calculateRemainingLimit,
  calculateUsedPercent,
  compactCurrency,
  formatCurrency,
  getCategoryName,
  getCategorySummaries,
  getDashboardSummary,
  getMemberName,
  getMemberSummaries,
  getTotalBankBalance,
  getTotalExpenses,
  getTotalMonthlyLimit,
  getTotalPayableBills,
  getTotalReceivableIncomes,
  getUpcomingBills,
} from "@/lib/finance/calculations";

describe("finance calculations", () => {
  it("formats currency in EUR for European family", () => {
    expect(formatCurrency(0)).toMatch(/0[,\.]00/);
    expect(formatCurrency(0)).toContain("€");
    expect(formatCurrency(150)).toMatch(/150[,\.]00/);
    expect(formatCurrency(150)).toContain("€");
    expect(formatCurrency(-20)).toContain("20");
    expect(formatCurrency(1_000_000)).toContain("1");
    expect(formatCurrency(1_000_000)).toContain("000");
  });

  it("compacts EUR currency without changing currency semantics", () => {
    expect(compactCurrency(0)).toContain("€");
    expect(compactCurrency(0)).toMatch(/0[,\.]00/);
    expect(compactCurrency(150)).toContain("€");
    expect(compactCurrency(150)).toMatch(/150[,\.]00/);
    expect(compactCurrency(-20)).toContain("€");
    expect(compactCurrency(-20)).toContain("20");
    expect(compactCurrency(1_000_000)).toContain("€");
    expect(compactCurrency(1_000_000)).toContain("1");
    expect(compactCurrency(1_000_000)).toContain("000");
  });

  it("calculates remaining limit with zero, negative and large values", () => {
    expect(calculateRemainingLimit(0, 0)).toBe(0);
    expect(calculateRemainingLimit(100, 0)).toBe(100);
    expect(calculateRemainingLimit(100, 150)).toBe(-50);
    expect(calculateRemainingLimit(100, -20)).toBe(120);
    expect(calculateRemainingLimit(1_000_000_000, 1)).toBe(999_999_999);
  });

  it("calculates used percent without division by zero", () => {
    expect(calculateUsedPercent(0, 0)).toBe(0);
    expect(calculateUsedPercent(10, 0)).toBe(0);
    expect(calculateUsedPercent(10, -100)).toBe(0);
    expect(calculateUsedPercent(-10, 100)).toBe(0);
    expect(calculateUsedPercent(Number.NaN, 100)).toBe(0);
    expect(calculateUsedPercent(50, 100)).toBe(50);
    expect(calculateUsedPercent(150, 100)).toBe(150);
    expect(calculateUsedPercent(1_000_000_000, 2_000_000_000)).toBe(50);
  });

  it("returns fixture lookups with safe fallbacks", () => {
    expect(getMemberName("danyel", familyMembers)).toBe("Danyel");
    expect(getMemberName("missing-member", familyMembers)).toBe("Nao informado");
    expect(getCategoryName("alimentacao", expenseCategories)).toBe("Alimentação");
    expect(getCategoryName("missing-category")).toBe("Outros");
  });

  it("calculates total metrics from fixtures", () => {
    expect(getTotalMonthlyLimit(familyMembers)).toBeGreaterThan(0);
    expect(getTotalExpenses(expenses)).toBeGreaterThan(0);
    expect(getTotalPayableBills(payableBills)).toBeGreaterThan(0);
    expect(getTotalReceivableIncomes(receivableIncomes)).toBeGreaterThan(0);
    expect(getTotalBankBalance(bankAccounts)).toBeGreaterThan(0);
  });

  it("calculates member summaries safely", () => {
    const summaries = getMemberSummaries(familyMembers, expenses);

    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries.every((summary) => Number.isFinite(summary.spent))).toBe(true);
    expect(summaries.every((summary) => Number.isFinite(summary.remaining))).toBe(true);
    expect(summaries.every((summary) => Number.isFinite(summary.usedPercent))).toBe(true);
  });

  it("sorts category summaries and filters empty categories", () => {
    const categories = getCategorySummaries(expenseCategories, expenses);

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every((category) => category.total > 0)).toBe(true);

    for (let index = 1; index < categories.length; index += 1) {
      expect(categories[index - 1].total).toBeGreaterThanOrEqual(categories[index].total);
    }
  });

  it("sorts upcoming bills by due date and excludes paid bills", () => {
    const bills = getUpcomingBills(payableBills);

    expect(bills.every((bill) => bill.status !== "pago")).toBe(true);

    for (let index = 1; index < bills.length; index += 1) {
      expect(new Date(bills[index - 1].dueDate).getTime()).toBeLessThanOrEqual(
        new Date(bills[index].dueDate).getTime(),
      );
    }
  });

  it("builds a complete dashboard summary", () => {
    const summary = getDashboardSummary({
      members: familyMembers,
      categories: expenseCategories,
      expenses,
      payableBills,
      receivableIncomes,
      bankAccounts,
    });

    expect(summary.totalMonthlyLimit).toBe(getTotalMonthlyLimit(familyMembers));
    expect(summary.totalExpenses).toBe(getTotalExpenses(expenses));
    expect(summary.remainingMonthlyLimit).toBe(summary.totalMonthlyLimit - summary.totalExpenses);
    expect(summary.memberSummaries.length).toBeGreaterThan(0);
    expect(summary.categorySummaries.length).toBeGreaterThan(0);
    expect(summary.upcomingBills.length).toBeGreaterThan(0);
  });
});
