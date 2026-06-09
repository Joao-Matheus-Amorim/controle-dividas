import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const serverPath = "lib/finance/server.ts";
const serverSource = readFileSync(join(process.cwd(), serverPath), "utf8");

const expectedPublicAsyncExports = [
  "seedInitialFinanceData",
  "getFamilyMembers",
  "getActiveFamilyMembers",
  "getExpenseCategories",
  "getExpenses",
  "getExpenseDashboardData",
  "getPayableBills",
  "getPayableBillsDashboardData",
  "getReceivableIncomes",
  "getReceivableIncomesDashboardData",
];

const forbiddenFinanceTables = [
  "banks",
  "expense_categories",
  "expenses",
  "family_members",
  "payable_bills",
  "profiles",
  "receivable_incomes",
  "user_feature_permissions",
  "user_module_permissions",
];

const forbiddenAggregationTokens = [
  ".reduce(",
  "computed_status",
  "memberSummaries",
  "totalExpenses",
  "totalPending",
  "totalOverdue",
  "totalPaid",
  "totalOneOff",
  "totalFixed",
  "totalExpected",
  "totalReceived",
  "totalVariable",
  "pendingCount",
  "overdueCount",
  "paidCount",
  "expectedCount",
  "receivedCount",
];

function publicAsyncExports(source: string) {
  return Array.from(source.matchAll(/export async function (\w+)\(/g)).map(
    ([, exportName]) => exportName,
  );
}

describe("finance server facade boundary", () => {
  it("keeps the intentional public async facade exports stable", () => {
    expect(publicAsyncExports(serverSource)).toEqual(expectedPublicAsyncExports);
  });

  it("does not access finance tables directly from the facade", () => {
    const forbiddenTableAccess = forbiddenFinanceTables.filter((tableName) =>
      new RegExp(`\\.from\\(\\s*["']${tableName}["']`).test(serverSource),
    );

    expect(forbiddenTableAccess).toEqual([]);
  });

  it("keeps dashboard aggregation logic outside the facade", () => {
    const aggregationTokensFound = forbiddenAggregationTokens.filter((token) =>
      serverSource.includes(token),
    );

    expect(aggregationTokensFound).toEqual([]);
  });

  it("delegates to dedicated domain helpers instead of owning business boundaries", () => {
    expect(serverSource).toContain("@/lib/finance/seed-server");
    expect(serverSource).toContain("@/lib/finance/members-server");
    expect(serverSource).toContain("@/lib/finance/categories-server");
    expect(serverSource).toContain("@/lib/finance/expenses-server");
    expect(serverSource).toContain("@/lib/finance/payables-server");
    expect(serverSource).toContain("@/lib/finance/receivables-server");
    expect(serverSource).toContain("@/lib/finance/expense-dashboard-server");
    expect(serverSource).toContain("@/lib/finance/payable-dashboard-server");
    expect(serverSource).toContain("@/lib/finance/receivable-dashboard-server");
  });

  it("seeds legacy owner data from the active organization owner", () => {
    expect(serverSource).toContain("organization.owner_auth_user_id");
    expect(serverSource).toContain("seedInitialFinanceDataForOwner(");
    expect(serverSource).not.toContain("await seedInitialFinanceDataForOwner(supabase, ownerId, organization.id)");
  });
});
