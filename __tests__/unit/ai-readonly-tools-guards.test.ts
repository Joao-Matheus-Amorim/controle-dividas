import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("AI read-only tools guards", () => {
  const tools = read("lib/ai/tools/finance-tools.ts");
  const registry = read("lib/ai/registry.ts");
  const guard = read("lib/ai/guard.ts");
  const confirm = read("lib/ai/confirm.ts");

  it("registers only read-only finance question actions", () => {
    expect(registry).toContain("getDashboardSummary");
    expect(registry).toContain("getUpcomingBills");
    expect(registry).toContain("getCategorySpendingSummary");
    expect(registry).toContain("getMemberLimitsSummary");
  });

  it("keeps new AI tools scoped by organization and accessible members", () => {
    expect(tools).toContain("getCategorySpendingSummary");
    expect(tools).toContain("getMemberLimitsSummary");
    expect(tools).toContain(".eq('organization_id', payload.organization_id)");
    expect(tools).toContain("getAccessibleMemberIds('GASTOS', 'can_view')");
    expect(tools).toContain(".gte('expense_date', startDate)");
    expect(tools).toContain(".lt('expense_date', endDate)");
  });

  it("does not add write operations to AI read-only tools", () => {
    expect(tools).not.toContain(".insert(");
    expect(tools).not.toContain(".update(");
    expect(tools).not.toContain(".delete(");
    expect(tools).not.toContain("createExpense");
    expect(tools).not.toContain("createPayableBill");
    expect(tools).not.toContain("createReceivableIncome");
    expect(tools).not.toContain("createBankAccount");
  });

  it("guards and auto-approves only the read-only action names", () => {
    expect(guard).toContain("getCategorySpendingSummary: 'view_reports'");
    expect(guard).toContain("getMemberLimitsSummary: 'view_own_limit'");
    expect(confirm).toContain("'getCategorySpendingSummary'");
    expect(confirm).toContain("'getMemberLimitsSummary'");
  });
});
