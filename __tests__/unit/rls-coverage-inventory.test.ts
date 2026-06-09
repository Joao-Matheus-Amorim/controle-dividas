import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type RlsPolicyExpectation = {
  file: string;
  name: string;
  operation: "select" | "insert" | "update" | "delete";
};

type RlsTableExpectation = {
  table: string;
  rlsFiles: string[];
  policies: RlsPolicyExpectation[];
  status: "covered" | "transitional";
};

const criticalFinanceTenantTables = [
  "organizations",
  "organization_memberships",
  "profiles",
  "family_members",
  "expenses",
  "expense_categories",
  "banks",
  "payable_bills",
  "receivable_incomes",
  "user_module_permissions",
  "user_feature_permissions",
] as const;

const rlsCoverage: RlsTableExpectation[] = [
  {
    table: "organizations",
    rlsFiles: ["006_organizations_memberships.sql"],
    status: "covered",
    policies: [
      { file: "006_organizations_memberships.sql", name: "organizations_select_member", operation: "select" },
      { file: "006_organizations_memberships.sql", name: "organizations_insert_owner", operation: "insert" },
      { file: "006_organizations_memberships.sql", name: "organizations_update_owner_or_admin", operation: "update" },
      { file: "006_organizations_memberships.sql", name: "organizations_delete_owner", operation: "delete" },
    ],
  },
  {
    table: "organization_memberships",
    rlsFiles: ["006_organizations_memberships.sql"],
    status: "covered",
    policies: [
      { file: "006_organizations_memberships.sql", name: "organization_memberships_select_member", operation: "select" },
      { file: "006_organizations_memberships.sql", name: "organization_memberships_insert_admin", operation: "insert" },
      { file: "006_organizations_memberships.sql", name: "organization_memberships_update_admin", operation: "update" },
      { file: "006_organizations_memberships.sql", name: "organization_memberships_delete_admin", operation: "delete" },
    ],
  },
  {
    table: "profiles",
    rlsFiles: ["036_profiles_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "036_profiles_rls_remove_legacy_fallback.sql", name: "profiles_select_organization", operation: "select" },
      { file: "036_profiles_rls_remove_legacy_fallback.sql", name: "profiles_insert_owner_organization", operation: "insert" },
      { file: "036_profiles_rls_remove_legacy_fallback.sql", name: "profiles_update_owner_organization", operation: "update" },
      { file: "036_profiles_rls_remove_legacy_fallback.sql", name: "profiles_delete_owner_organization", operation: "delete" },
    ],
  },
  {
    table: "family_members",
    rlsFiles: ["031_family_members_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "031_family_members_rls_remove_legacy_fallback.sql", name: "family_members_select_organization", operation: "select" },
      { file: "031_family_members_rls_remove_legacy_fallback.sql", name: "family_members_insert_owner_organization", operation: "insert" },
      { file: "031_family_members_rls_remove_legacy_fallback.sql", name: "family_members_update_owner_organization", operation: "update" },
      { file: "031_family_members_rls_remove_legacy_fallback.sql", name: "family_members_delete_owner_organization", operation: "delete" },
    ],
  },
  {
    table: "expenses",
    rlsFiles: ["032_expenses_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "032_expenses_rls_remove_legacy_fallback.sql", name: "expenses_select_organization", operation: "select" },
      { file: "032_expenses_rls_remove_legacy_fallback.sql", name: "expenses_insert_owner_organization", operation: "insert" },
      { file: "032_expenses_rls_remove_legacy_fallback.sql", name: "expenses_update_owner_organization", operation: "update" },
      { file: "032_expenses_rls_remove_legacy_fallback.sql", name: "expenses_delete_owner_organization", operation: "delete" },
    ],
  },
  {
    table: "expense_categories",
    rlsFiles: [
      "030_expense_categories_rls_remove_legacy_fallback.sql",
      "048_expense_categories_organization_write_rls.sql",
    ],
    status: "covered",
    policies: [
      { file: "030_expense_categories_rls_remove_legacy_fallback.sql", name: "expense_categories_select_organization", operation: "select" },
      { file: "048_expense_categories_organization_write_rls.sql", name: "expense_categories_insert_organization", operation: "insert" },
      { file: "048_expense_categories_organization_write_rls.sql", name: "expense_categories_update_organization", operation: "update" },
      { file: "048_expense_categories_organization_write_rls.sql", name: "expense_categories_delete_organization", operation: "delete" },
    ],
  },
  {
    table: "banks",
    rlsFiles: ["035_banks_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "035_banks_rls_remove_legacy_fallback.sql", name: "banks_select_organization", operation: "select" },
      { file: "035_banks_rls_remove_legacy_fallback.sql", name: "banks_insert_owner_organization", operation: "insert" },
      { file: "035_banks_rls_remove_legacy_fallback.sql", name: "banks_update_owner_organization", operation: "update" },
      { file: "035_banks_rls_remove_legacy_fallback.sql", name: "banks_delete_owner_organization", operation: "delete" },
    ],
  },
  {
    table: "payable_bills",
    rlsFiles: ["033_payable_bills_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "033_payable_bills_rls_remove_legacy_fallback.sql", name: "payable_bills_select_organization", operation: "select" },
      { file: "033_payable_bills_rls_remove_legacy_fallback.sql", name: "payable_bills_insert_owner_organization", operation: "insert" },
      { file: "033_payable_bills_rls_remove_legacy_fallback.sql", name: "payable_bills_update_owner_organization", operation: "update" },
      { file: "033_payable_bills_rls_remove_legacy_fallback.sql", name: "payable_bills_delete_owner_organization", operation: "delete" },
    ],
  },
  {
    table: "receivable_incomes",
    rlsFiles: ["034_receivable_incomes_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "034_receivable_incomes_rls_remove_legacy_fallback.sql", name: "receivable_incomes_select_organization", operation: "select" },
      { file: "034_receivable_incomes_rls_remove_legacy_fallback.sql", name: "receivable_incomes_insert_owner_organization", operation: "insert" },
      { file: "034_receivable_incomes_rls_remove_legacy_fallback.sql", name: "receivable_incomes_update_owner_organization", operation: "update" },
      { file: "034_receivable_incomes_rls_remove_legacy_fallback.sql", name: "receivable_incomes_delete_owner_organization", operation: "delete" },
    ],
  },
  {
    table: "user_module_permissions",
    rlsFiles: ["037_user_module_permissions_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "037_user_module_permissions_rls_remove_legacy_fallback.sql", name: "module_permissions_select_organization", operation: "select" },
      { file: "037_user_module_permissions_rls_remove_legacy_fallback.sql", name: "module_permissions_insert_owner_organization", operation: "insert" },
      { file: "037_user_module_permissions_rls_remove_legacy_fallback.sql", name: "module_permissions_update_owner_organization", operation: "update" },
      { file: "037_user_module_permissions_rls_remove_legacy_fallback.sql", name: "module_permissions_delete_owner_organization", operation: "delete" },
    ],
  },
  {
    table: "user_feature_permissions",
    rlsFiles: ["038_user_feature_permissions_rls_remove_legacy_fallback.sql"],
    status: "covered",
    policies: [
      { file: "038_user_feature_permissions_rls_remove_legacy_fallback.sql", name: "feature_permissions_select_organization", operation: "select" },
      { file: "038_user_feature_permissions_rls_remove_legacy_fallback.sql", name: "feature_permissions_insert_owner_organization", operation: "insert" },
      { file: "038_user_feature_permissions_rls_remove_legacy_fallback.sql", name: "feature_permissions_update_owner_organization", operation: "update" },
      { file: "038_user_feature_permissions_rls_remove_legacy_fallback.sql", name: "feature_permissions_delete_owner_organization", operation: "delete" },
    ],
  },
];

const membershipTableName = "organization_" + "memberships";
const membershipTableReadPattern = new RegExp(String.raw`\bfrom\s+public\s*\.\s*${membershipTableName}\b`, "i");

function migrationPath(file: string) {
  return join(process.cwd(), "supabase/migrations", file);
}

function readMigration(file: string) {
  return readFileSync(migrationPath(file), "utf8");
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/g, ""))
    .join("\n");
}

function readExecutableMigration(file: string) {
  return stripSqlComments(readMigration(file));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function policyPattern(table: string, policy: RlsPolicyExpectation) {
  return new RegExp(
    `create\\s+policy\\s+"${escapeRegExp(policy.name)}"[\\s\\S]*?on\\s+public\\.${escapeRegExp(table)}[\\s\\S]*?for\\s+${policy.operation}`,
    "i",
  );
}

function policyBlock(file: string, table: string, policy: RlsPolicyExpectation) {
  const sql = readExecutableMigration(file);
  const startMatch = policyPattern(table, policy).exec(sql);

  expect(startMatch, `Missing executable policy ${policy.name} for ${table}`).not.toBeNull();

  const start = startMatch?.index ?? 0;
  const nextPolicy = /\n\s*create\s+policy\s+"/gi;
  nextPolicy.lastIndex = start + 1;
  const nextMatch = nextPolicy.exec(sql);

  return sql.slice(start, nextMatch?.index ?? sql.length);
}

describe("RLS coverage inventory", () => {
  it("lists every critical finance tenant table exactly once", () => {
    const auditedTables = rlsCoverage.map((item) => item.table).sort();
    expect(auditedTables).toEqual([...criticalFinanceTenantTables].sort());
  });

  it("does not treat commented-out RLS statements as executable coverage", () => {
    const commentedSql = `
      -- alter table public.fake enable row level security;
      /* create policy "fake_select" on public.fake for select using (true); */
    `;

    expect(stripSqlComments(commentedSql)).not.toMatch(/enable\s+row\s+level\s+security/i);
    expect(stripSqlComments(commentedSql)).not.toMatch(/create\s+policy/i);
  });

  it("matches membership table reads regardless of SQL formatting", () => {
    expect("FROM public." + membershipTableName).toMatch(membershipTableReadPattern);
    expect("from\n  public." + membershipTableName).toMatch(membershipTableReadPattern);
    expect("from\tpublic . " + membershipTableName).toMatch(membershipTableReadPattern);
  });

  it.each(rlsCoverage)("enables RLS for $table", (entry) => {
    const hasEnableStatement = entry.rlsFiles.some((file) => {
      if (!existsSync(migrationPath(file))) {
        return false;
      }

      return new RegExp(`alter\\s+table\\s+public\\.${entry.table}\\s+enable\\s+row\\s+level\\s+security`, "i").test(
        readExecutableMigration(file),
      );
    });

    expect(hasEnableStatement, `Missing executable RLS enable statement for ${entry.table}`).toBe(true);
  });

  it.each(rlsCoverage)("declares select/insert/update/delete policies for $table", (entry) => {
    const operations = entry.policies.map((policy) => policy.operation).sort();
    expect(operations).toEqual(["delete", "insert", "select", "update"]);
  });

  it.each(rlsCoverage.flatMap((entry) => entry.policies.map((policy) => ({ ...policy, table: entry.table }))))(
    "keeps executable $operation policy $name for $table",
    ({ table, ...policy }) => {
      expect(existsSync(migrationPath(policy.file)), `Missing migration file ${policy.file}`).toBe(true);
      expect(readExecutableMigration(policy.file)).toMatch(policyPattern(table, policy));
    },
  );

  it("keeps organization membership policy blocks on SECURITY DEFINER helpers", () => {
    const expectations = [
      {
        name: "organization_memberships_select_member",
        operation: "select" as const,
        helper: "public.is_organization_member(organization_id)",
      },
      {
        name: "organization_memberships_insert_admin",
        operation: "insert" as const,
        helper: "public.is_organization_admin(organization_id)",
      },
      {
        name: "organization_memberships_update_admin",
        operation: "update" as const,
        helper: "public.is_organization_admin(organization_id)",
      },
      {
        name: "organization_memberships_delete_admin",
        operation: "delete" as const,
        helper: "public.is_organization_admin(organization_id)",
      },
    ];

    const migration = readExecutableMigration("006_organizations_memberships.sql");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");

    expectations.forEach((policy) => {
      const block = policyBlock("006_organizations_memberships.sql", "organization_memberships", {
        file: "006_organizations_memberships.sql",
        ...policy,
      });

      expect(block).toContain(policy.helper);
      expect(block).not.toMatch(membershipTableReadPattern);
    });
  });

  it("has no remaining transitional RLS fallback tables", () => {
    const transitionalTables = rlsCoverage
      .filter((entry) => entry.status === "transitional")
      .map((entry) => entry.table)
      .sort();

    expect(transitionalTables).toEqual([]);
  });
});
