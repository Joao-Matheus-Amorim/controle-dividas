import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

type InsertGuard = {
  path: string;
  table: string;
  functionName: string;
};

const insertGuards: InsertGuard[] = [
  {
    path: "app/protected/pessoas/actions.ts",
    table: "family_members",
    functionName: "createFamilyMember",
  },
  {
    path: "app/protected/configuracoes/actions.ts",
    table: "expense_categories",
    functionName: "createExpenseCategory",
  },
  {
    path: "app/protected/gastos/actions.ts",
    table: "expenses",
    functionName: "createExpense",
  },
  {
    path: "app/protected/contas-a-pagar/actions.ts",
    table: "payable_bills",
    functionName: "createPayableBill",
  },
  {
    path: "app/protected/contas-a-receber/actions.ts",
    table: "receivable_incomes",
    functionName: "createReceivableIncome",
  },
  {
    path: "app/protected/bancos/actions.ts",
    table: "banks",
    functionName: "createBankAccount",
  },
];

describe("organization_id insert guards", () => {
  it.each(insertGuards)(
    "$functionName inserts new $table rows with the active organization id",
    ({ path, table, functionName }) => {
      const source = readSource(path);
      const functionIndex = source.indexOf(`function ${functionName}`);
      const insertIndex = source.indexOf(`.from("${table}").insert({`, functionIndex);
      const organizationIndex = source.indexOf("organization_id: organization.id", insertIndex);

      expect(functionIndex, `${path} must define ${functionName}`).toBeGreaterThanOrEqual(0);
      expect(insertIndex, `${functionName} must insert into ${table}`).toBeGreaterThan(functionIndex);
      expect(
        organizationIndex,
        `${functionName} must write organization_id from the active organization`,
      ).toBeGreaterThan(insertIndex);
    },
  );
});
