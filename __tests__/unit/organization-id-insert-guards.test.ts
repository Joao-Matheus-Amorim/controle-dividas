import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

function getFunctionBody(source: string, functionName: string) {
  const functionIndex = source.indexOf(`function ${functionName}`);

  if (functionIndex < 0) {
    return null;
  }

  const bodyStart = source.indexOf("{", functionIndex);

  if (bodyStart < 0) {
    return null;
  }

  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;
    }

    if (depth === 0) {
      return source.slice(bodyStart, index + 1);
    }
  }

  return null;
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
      const functionBody = getFunctionBody(source, functionName);

      expect(functionBody, `${path} must define ${functionName}`).not.toBeNull();
      expect(
        functionBody,
        `${functionName} must insert into ${table}`,
      ).toContain(`.from("${table}").insert({`);
      expect(
        functionBody,
        `${functionName} insert must write organization_id from the active organization`,
      ).toContain("organization_id: organization.id");
    },
  );
});
