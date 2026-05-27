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
  requiresActiveOrganizationFilter?: boolean;
  payloadVariable?: string;
  targetHint?: string;
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
    requiresActiveOrganizationFilter: true,
  },
  {
    file: "app/protected/pessoas/actions.ts",
    functionName: "toggleFamilyMemberStatus",
    table: "family_members",
    operation: "update",
    requiresOrganizationId: true,
    requiresActiveOrganizationFilter: true,
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
    payloadVariable: "permissionRows",
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "updateFamilyUser",
    table: "profiles",
    operation: "update",
    requiresOrganizationId: true,
    requiresActiveOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "syncFamilyUserAuthLink",
    table: "profiles",
    operation: "update",
    requiresOrganizationId: true,
    requiresActiveOrganizationFilter: true,
    targetHint: "auth_user_id: authUserId",
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "deleteFamilyUser",
    table: "profiles",
    operation: "delete",
    requiresActiveOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "toggleFamilyUserStatus",
    table: "profiles",
    operation: "update",
    requiresOrganizationId: true,
    requiresActiveOrganizationFilter: true,
  },
  {
    file: "app/protected/admin/actions.ts",
    functionName: "saveProfilePermissions",
    table: "user_module_permissions",
    operation: "upsert",
    requiresOrganizationId: true,
    payloadVariable: "rows",
  },
];

function readSource(file: string) {
  return readFileSync(join(process.cwd(), file), "utf8");
}

function compact(source: string) {
  return source.replace(/\s+/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function functionBlock(file: string, functionName: string) {
  const source = readSource(file);
  const startToken = `export async function ${functionName}`;
  const start = source.indexOf(startToken);

  expect(start, `Missing function ${functionName} in ${file}`).toBeGreaterThanOrEqual(0);

  const next = source.indexOf("\nexport async function ", start + startToken.length);

  return source.slice(start, next >= 0 ? next : source.length);
}

function targetWriteBlock(
  source: string,
  table: string,
  operation: Operation,
  targetHint?: string,
) {
  const compactSource = compact(source);
  const tableTokenDouble = `.from("${table}")`;
  const tableTokenSingle = `.from('${table}')`;
  const candidates: string[] = [];

  let searchIndex = 0;

  while (searchIndex < compactSource.length) {
    const doubleIndex = compactSource.indexOf(tableTokenDouble, searchIndex);
    const singleIndex = compactSource.indexOf(tableTokenSingle, searchIndex);

    const indexes = [doubleIndex, singleIndex].filter((index) => index >= 0);
    const start = indexes.length > 0 ? Math.min(...indexes) : -1;

    if (start < 0) break;

    const nextFrom = compactSource.indexOf(".from(", start + 1);
    const candidate = compactSource.slice(
      start,
      nextFrom >= 0 ? nextFrom : compactSource.length,
    );

    if (candidate.includes(`.${operation}(`)) {
      candidates.push(candidate);
    }

    searchIndex = start + 1;
  }

  expect(
    candidates.length,
    `Missing ${operation} write for ${table}`,
  ).toBeGreaterThan(0);

  if (!targetHint) {
    return candidates[0];
  }

  const compactHint = compact(targetHint);
  const hintedCandidate = candidates.find((candidate) =>
    candidate.includes(compactHint),
  );

  expect(
    hintedCandidate,
    `Missing ${operation} write for ${table} with hint ${targetHint}`,
  ).toBeDefined();

  return hintedCandidate ?? candidates[0];
}

function variableBlock(source: string, variableName: string) {
  const declaration = new RegExp(
    `\\b(?:const|let)\\s+${escapeRegExp(variableName)}\\b(?:\\s*:[^=;]+)?\\s*=`,
  );
  const startMatch = declaration.exec(source);

  expect(startMatch, `Missing variable ${variableName}`).not.toBeNull();

  const start = startMatch?.index ?? 0;
  const nextFrom = source.indexOf(".from(", start + 1);

  return compact(source.slice(start, nextFrom >= 0 ? nextFrom : source.length));
}

const organizationIdAssignment = /organization_id:organization\.id/;
const organizationFilter = /\.or\(organizationOrLegacyFilter\(organization\.id\)\)/;
const activeOrganizationFilter = /\.eq\("organization_id",organization\.id\)/;

describe("finance write organization_id coverage", () => {
  it("does not let a different write satisfy the target write organization_id assertion", () => {
    const source = `
      await supabase
        .from("profiles")
        .insert({ organization_id: organization.id });

      await supabase
        .from("user_module_permissions")
        .insert({ profile_id: profile.id });
    `;

    const target = targetWriteBlock(source, "user_module_permissions", "insert");

    expect(target).not.toMatch(organizationIdAssignment);
  });

  it("does not let a scoped read satisfy the target mutation organization filter assertion", () => {
    const source = `
      await supabase
        .from("profiles")
        .select("id")
        .or(organizationOrLegacyFilter(organization.id));

      await supabase
        .from("profiles")
        .update({ organization_id: organization.id })
        .eq("id", id);
    `;

    const target = targetWriteBlock(source, "profiles", "update");

    expect(target).not.toMatch(organizationFilter);
  });

  it("supports typed and mutable payload variable declarations", () => {
    const typedConstSource = `
      const rows: PermissionRow[] = [
        { organization_id: organization.id },
      ];

      await supabase.from("user_module_permissions").upsert(rows);
    `;

    const letSource = `
      let permissionRows = [
        { organization_id: organization.id },
      ];

      await supabase.from("user_module_permissions").insert(permissionRows);
    `;

    expect(variableBlock(typedConstSource, "rows")).toMatch(organizationIdAssignment);
    expect(variableBlock(letSource, "permissionRows")).toMatch(organizationIdAssignment);
  });

  it.each(writeExpectations)(
    "$functionName $operation on $table keeps organization context on the target write",
    (expectation) => {
      const block = functionBlock(expectation.file, expectation.functionName);
      const write = targetWriteBlock(
        block,
        expectation.table,
        expectation.operation,
        expectation.targetHint,
      );

      if (expectation.payloadVariable) {
        expect(
          write,
          `${expectation.functionName} should use payload variable ${expectation.payloadVariable} for ${expectation.table}`,
        ).toContain(`.${expectation.operation}(${expectation.payloadVariable}`);
      }

      const organizationSubject = expectation.payloadVariable
        ? variableBlock(block, expectation.payloadVariable)
        : write;

      if (expectation.requiresOrganizationId) {
        expect(
          organizationSubject,
          `${expectation.functionName} should set active organization_id on ${expectation.table}`,
        ).toMatch(organizationIdAssignment);
      }

      if (expectation.requiresOrganizationFilter) {
        expect(
          write,
          `${expectation.functionName} should scope ${expectation.table} mutation by active/legacy organization`,
        ).toMatch(organizationFilter);
      }

      if (expectation.requiresActiveOrganizationFilter) {
        expect(
          write,
          `${expectation.functionName} should scope ${expectation.table} mutation by active organization`,
        ).toMatch(activeOrganizationFilter);
      }
    },
  );

  it("keeps bootstrap admin profile explicitly transitional until organization onboarding assigns scope", () => {
    const bootstrap = readSource("lib/finance/bootstrap-admin-profile.ts");

    expect(bootstrap).toContain("owner_id: authUserId");
    expect(bootstrap).not.toContain("organization_id");
  });
});
