import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type FunctionExpectation = {
  file: string;
  functionName: string;
  table: string;
  operation: "insert" | "update" | "upsert" | "delete";
  requiresOrganizationId?: boolean;
  requiresOrganizationFilter?: boolean;
};

const writeExpectations: FunctionExpectation[] = [
  {
    file: "app/protected/pessoas/actions.ts",
    functionName: "createFamilyMember",
    table: "family_members",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/pessoas/actions.ts",
    functionName: "updateFamilyMember",
    table: "family_members",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/pessoas/actions.ts",
    functionName: "toggleFamilyMemberStatus",
    table: "family_members",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/configuracoes/actions.ts",
    functionName: "createExpenseCategory",
    table: "expense_categories",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/configuracoes/actions.ts",
    functionName: "updateExpenseCategory",
    table: "expense_categories",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/configuracoes/actions.ts",
    functionName: "deleteExpenseCategory",
    table: "expense_categories",
    operation: "delete",
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/configuracoes/actions.ts",
    functionName: "updateFamilyMemberLimit",
    table: "family_members",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/gastos/actions.ts",
    functionName: "createExpense",
    table: "expenses",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/gastos/actions.ts",
    functionName: "updateExpense",
    table: "expenses",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/gastos/actions.ts",
    functionName: "deleteExpense",
    table: "expenses",
    operation: "delete",
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/bancos/actions.ts",
    functionName: "createBankAccount",
    table: "banks",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/bancos/actions.ts",
    functionName: "updateBankAccount",
    table: "banks",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/bancos/actions.ts",
    functionName: "updateBankAccountBalance",
    table: "banks",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/bancos/actions.ts",
    functionName: "deleteBankAccount",
    table: "banks",
    operation: "delete",
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/contas-a-pagar/actions.ts",
    functionName: "createPayableBill",
    table: "payable_bills",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/contas-a-pagar/actions.ts",
    functionName: "updatePayableBill",
    table: "payable_bills",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/contas-a-pagar/actions.ts",
    functionName: "updatePayableBillStatus",
    table: "payable_bills",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/contas-a-pagar/actions.ts",
    functionName: "deletePayableBill",
    table: "payable_bills",
    operation: "delete",
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/contas-a-receber/actions.ts",
    functionName: "createReceivableIncome",
    table: "receivable_incomes",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/contas-a-receber/actions.ts",
    functionName: "updateReceivableIncome",
    table: "receivable_incomes",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/contas-a-receber/actions.ts",
    functionName: "updateReceivableIncomeStatus",
    table: "receivable_incomes",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/contas-a-receber/actions.ts",
    functionName: "deleteReceivableIncome",
    table: "receivable_incomes",
    operation: "delete",
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "createFamilyUser",
    table: "profiles",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "createFamilyUser",
    table: "user_module_permissions",
    operation: "insert",
    requiresOrganizationId: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "updateFamilyUser",
    table: "profiles",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "syncFamilyUserAuthLink",
    table: "profiles",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "deleteFamilyUser",
    table: "profiles",
    operation: "delete",
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "toggleFamilyUserStatus",
    table: "profiles",
    operation: "update",
    requiresOrganizationId: true,
    requiresOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "saveProfilePermissions",
    table: "user_module_permissions",
    operation: "upsert",
    requiresOrganizationId: true,
  },
];

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

function tableWritePattern(table: string, operation: FunctionExpectation["operation"]) {
  return new RegExp(`\\.from\\(\\s*["']${escapeRegExp(table)}["']\\s*\\)[\\s\\S]*?\\.${operation}\\(`);
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

      expect(block, `${expectation.functionName} should write ${expectation.table}`).toMatch(
        tableWritePattern(expectation.table, expectation.operation),
      );

      if (expectation.requiresOrganizationId) {
        expect(block, `${expectation.functionName} should set active organization_id`).toMatch(
          organizationIdAssignmentPattern(),
        );
      }

      if (expectation.requiresOrganizationFilter) {
        expect(block, `${expectation.functionName} should scope by active/legacy organization`).toMatch(
          organizationFilterPattern(),
        );
      }
    },
  );

  it("keeps bootstrap admin profile explicitly transitional until organization onboarding assigns scope", () => {
    const bootstrap = readSource("lib/finance/bootstrap-admin-profile.ts");

    expect(bootstrap).toContain("owner_id: authUserId");
    expect(bootstrap).not.toContain("organization_id");
  });
});
