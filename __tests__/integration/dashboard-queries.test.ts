import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { mockDashboardTables, mockSupabaseUrl } from "@/__tests__/fixtures/msw-finance-data";
import { mswFinanceHandlers } from "@/__tests__/fixtures/msw-handlers";

const server = setupServer(...mswFinanceHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getTable(table: keyof typeof mockDashboardTables) {
  const response = await fetch(`${mockSupabaseUrl}/rest/v1/${table}`);
  if (!response.ok) throw new Error(`Failed to fetch ${table}`);
  return response.json();
}

async function getDashboardData() {
  const [members, expenses, payables, receivables, banks] = await Promise.all([
    getTable("family_members"),
    getTable("expenses"),
    getTable("payable_bills"),
    getTable("receivable_incomes"),
    getTable("banks"),
  ]);

  return { members, expenses, payables, receivables, banks };
}

describe("dashboard queries integration", () => {
  it("loads all five dashboard query groups", async () => {
    const data = await getDashboardData();

    expect(data.members).toEqual(mockDashboardTables.family_members);
    expect(data.expenses).toEqual(mockDashboardTables.expenses);
    expect(data.payables).toEqual(mockDashboardTables.payable_bills);
    expect(data.receivables).toEqual(mockDashboardTables.receivable_incomes);
    expect(data.banks).toEqual(mockDashboardTables.banks);
  });

  it("calculates dashboard totals from mocked tables", async () => {
    const data = await getDashboardData();

    expect(data.expenses.reduce((total: number, row: { amount: number }) => total + row.amount, 0)).toBe(30);
    expect(data.payables.reduce((total: number, row: { amount: number }) => total + row.amount, 0)).toBe(40);
    expect(data.receivables.reduce((total: number, row: { amount: number }) => total + row.amount, 0)).toBe(100);
    expect(data.banks.reduce((total: number, row: { current_balance: number }) => total + row.current_balance, 0)).toBe(500);
  });

  it("fails in a controlled way when one query fails", async () => {
    server.use(http.get(`${mockSupabaseUrl}/rest/v1/banks`, () => HttpResponse.json({}, { status: 500 })));

    await expect(getDashboardData()).rejects.toThrow("Failed to fetch banks");
  });
});
