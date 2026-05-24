import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type Operation = "insert" | "update" | "upsert" | "delete";

type FunctionExpectation = {
  file: string;
  functionName: string;
  table: string;
  operation: Operation;
  requiresOrganizationId?: boolean;
  requiresOrganizationFilter?: boolean;
};

const writeExpectations: FunctionExpectation[] = [
  ["app/protected/pessoas/actions.ts", "createFamilyMember", "family_members", "insert", true, false],
  ["app/protected/pessoas/actions.ts", "updateFamilyMember", "family_members", "update", true, true],
  ["app/protected/pessoas/actions.ts", "toggleFamilyMemberStatus", "family_members", "update", true, true],
  ["app/protected/configuracoes/actions.ts", "createExpenseCategory", "expense_categories", "insert", true, false],
  ["app/protected/configuracoes/actions.ts", "updateExpenseCategory", "expense_categories", "update", true, true],
  ["app/protected/configuracoes/actions.ts", "deleteExpenseCategory", "expense_categories", "delete", false, true],
  ["app/protected/configuracoes/actions.ts", "updateFamilyMemberLimit", "family_members", "update", true, true],
  ["app/protected/gastos/actions.ts", "createExpense", "expenses", "insert", true, false],
  ["app/protected/gastos/actions.ts", "updateExpense", "expenses", "update", true, true],
  ["app/protected/gastos/actions.ts", "deleteExpense", "expenses", "delete", false, true],
  ["app/protected/bancos/actions.ts", "createBankAccount", "banks", "insert", true, false],
  ["app/protected/bancos/actions.ts", "updateBankAccount", "banks", "update", true, true],
  ["app/protected/bancos/actions.ts", "updateBankAccountBalance", "banks", "update", true, true],
  ["app/protected/bancos/actions.ts", "deleteBankAccount", "banks", "delete", false, true],
  ["app/protected/contas-a-pagar/actions.ts", "createPayableBill", "payable_bills", "insert", true, false],
  ["app/protected/contas-a-pagar/actions.ts", "updatePayableBill", "payable_bills", "update", true, true],
  ["app/protected/contas-a-pagar/actions.ts", "updatePayableBillStatus", "payable_bills", "update", true, true],
  ["app/protected/contas-a-pagar/actions.ts", "deletePayableBill", "payable_bills", "delete", false, true],
  ["app/protected/contas-a-receber/actions.ts", "createReceivableIncome", "receivable_incomes", "insert", true, false],
  ["app/protected/contas-a-receber/actions.ts", "updateReceivableIncome", "receivable_incomes", "update", true, true],
  ["app/protected/contas-a-receber/actions.ts", "updateReceivableIncomeStatus", "receivable_incomes", "update", true, true],
  ["app/protected/contas-a-receber/actions.ts", "deleteReceivableIncome", "receivable_incomes", "delete", false, true],
  ["app/protected/admin/actions.ts", "createFamilyUser", "profiles", "insert", true, false],
  ["app/protected/admin/actions.ts", "createFamilyUser", "user_module_permissions", "insert", true, false],
  ["app/protected/admin/actions.ts", "updateFamilyUser", "profiles", "update", true, true],
  ["app/protected/admin/actions.ts", "syncFamilyUserAuthLink", "profiles", "update", true, true],
  ["app/protected/admin/actions.ts", "deleteFamilyUser", "profiles", "delete", false, true],
  ["app/protected/admin/actions.ts", "toggleFamilyUserStatus", "profiles", "update", true, true],
  ["app/protected/admin/actions.ts", "saveProfilePermissions", "user_module_permissions", "upsert", true, false],
].map(([file, functionName, table, operation, requiresOrganizationId, requiresOrganizationFilter]) => ({
  file,
  functionName,
  table,
  operation,
  requiresOrganizationId,
  requiresOrganizationFilter,
})) as FunctionExpectation[];

function sourcePath(file: string) {
  return join(process.cwd(), file);
}

function readSource(file: string) {
  return readFileSync(sourcePath(file), "utf8");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function functionBlock(file: string, functionName: string) {
  const source = readSource(file);
  const startPattern = new RegExp(`export\\s+async\\s+function\\s+${escapeRegExp(functionName)}\\b`);
  const startMatch = startPattern.exec(source);

  expect(startMatch, `Missing function ${functionName} in ${file}`).not.toBeNull();

  const start = startMatch?.index ?? 0;
  const nextFunction = /\nexport\s+async\s+function\s+/g;
  nextFunction.lastIndex = start + 1;
  const nextMatch = nextFunction.exec(source);

  return source.slice(start, nextMatch?.index ?? source.length);
}

function tableFromPattern(table: string) {
  return new RegExp(`\\.from\\(\\s*["']${escapeRegExp(table)}["']\\s*\\)`, "g");
}

function operationPattern(operation: Operation) {
  return new RegExp(`\\.${operation}\\(`);
}

function mutationCallBlock(source: string, table: string, operation: Operation) {
  const fromPattern = tableFromPattern(table);
  let match: RegExpExecArray | null;

  while ((match = fromPattern.exec(source)) !== null) {
    const start = match.index;
    fromPattern.lastIndex = start + match[0].length;

    const nextFromPattern = /\.from\(\s*["']/g;
    nextFromPattern.lastIndex = start + match[0].length;
    const nextFrom = nextFromPattern.exec(source);
    const candidate = source.slice(start, nextFrom?.index ?? source.length);

    if (operationPattern(operation).test(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Missing ${operation} mutation for ${table}`);
}

function organizationIdAssignmentPattern() {
  return /organization_id\s*:\s*organization\.id/;
}

function organizationFilterPattern() {
  return /\.or\(\s*organizationOrLegacyFilter\(organization\.id\)\s*\)/;
}

describe("finance write organization_id coverage", () => {
  it.each(writeExpectations)(
    "$functionName $operation on $table keeps organization context",
    (expectation) => {
      const block = functionBlock(expectation.file, expectation.functionName);
      const mutation = mutationCallBlock(block, expectation.table, expectation.operation);

      if (expectation.requiresOrganizationId) {
        expect(
          mutation,
          `${expectation.functionName} should set active organization_id on ${expectation.table}`,
        ).toMatch(organizationIdAssignmentPattern());
      }

      if (expectation.requiresOrganizationFilter) {
        expect(
          mutation,
          `${expectation.functionName} should scope ${expectation.table} mutation by active/legacy organization`,
        ).toMatch(organizationFilterPattern());
      }
    },
  );

  it("keeps bootstrap admin profile explicitly transitional until organization onboarding assigns scope", () => {
    const bootstrap = readSource("lib/finance/bootstrap-admin-profile.ts");

    expect(bootstrap).toContain("owner_id: authUserId");
    expect(bootstrap).not.toContain("organization_id");
  });
});
