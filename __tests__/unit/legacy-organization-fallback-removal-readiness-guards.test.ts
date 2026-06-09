import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8").toLowerCase();
}

function getSection(source: string, heading: string, nextHeading: string) {
  const start = source.indexOf(heading.toLowerCase());
  const end = source.indexOf(nextHeading.toLowerCase(), start + heading.length);

  expect(start, `missing section heading: ${heading}`).toBeGreaterThanOrEqual(0);
  expect(end, `missing next section heading: ${nextHeading}`).toBeGreaterThan(start);

  return source.slice(start, end);
}

function getFunctionSource(source: string, functionName: string, nextFunctionName?: string) {
  const start = source.indexOf(`function ${functionName}`.toLowerCase());
  const end = nextFunctionName
    ? source.indexOf(`function ${nextFunctionName}`.toLowerCase(), start + functionName.length)
    : source.length;

  expect(start, `missing function: ${functionName}`).toBeGreaterThanOrEqual(0);
  expect(end, `missing next function: ${nextFunctionName}`).toBeGreaterThan(start);

  return source.slice(start, end);
}

describe("legacy organization fallback removal readiness", () => {
  it("keeps admin actions scoped to active organization equality", () => {
    const source = readSource("app/protected/admin/actions.ts");

    expect(source).toContain("requireorganizationadmin");
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain('.eq("owner_id", adminprofile.owner_id)');
    expect(source).not.toContain("organization_id.is.null");
    expect(source).not.toContain(".or(organizationorlegacyfilter");
  });

  it("keeps bank organization helper reads scoped to active organization equality", () => {
    const source = readSource("lib/organizations/banks.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps category organization helper reads scoped to active organization equality", () => {
    const source = readSource("lib/organizations/categories.ts");
    const organizationRead = getFunctionSource(source, "getorganizationexpensecategories");

    expect(source).toContain("requireorganizationaccess");
    expect(organizationRead).not.toContain('.eq("owner_id"');
    expect(organizationRead).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("getmanageableorganizationexpensecategories");
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps settings category list visible while write controls require category managers", () => {
    const pageSource = readSource("features/protected-pages/configuracoes-page.tsx");
    const componentSource = readSource("components/settings/settings-categories.tsx");

    expect(pageSource).toContain("getorganizationexpensecategories");
    expect(pageSource).toContain("getorganizationexpensecategories(orgslug)");
    expect(pageSource).toContain("const canmanagecategories");
    expect(pageSource).toContain('["owner", "admin"].includes(organization.membership.role)');
    expect(pageSource).toContain("canmanagecategories={canmanagecategories}");
    expect(pageSource).not.toContain("getmanageableorganizationexpensecategories");

    expect(componentSource).toContain("canmanagecategories");
    expect(componentSource).toContain("canmanagecategories = false");
    expect(componentSource).toContain("canmanagecategories ? (");
    expect(componentSource).toContain("<expensecategoryform");
    expect(componentSource).toContain("!category.is_default && canmanagecategories");
  });

  it("keeps payable organization helper reads scoped to active organization equality", () => {
    const source = readSource("lib/organizations/payables.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });


  it("keeps expense organization helper reads scoped to active organization equality", () => {
    const source = readSource("lib/organizations/expenses.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps receivable organization helper reads scoped to active organization equality", () => {
    const source = readSource("lib/organizations/receivables.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps people organization helper reads scoped to active organization equality", () => {
    const source = readSource("lib/organizations/people.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).not.toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps people page and action paths scoped to active organization equality", () => {
    const pageSource = readSource("features/protected-pages/pessoas-page.tsx");
    const actionSource = readSource("app/protected/pessoas/actions.ts");

    expect(pageSource).toContain("requireorganizationaccess");
    expect(pageSource).not.toContain('.eq("owner_id", ownerid)');
    expect(pageSource).toContain('.eq("organization_id", organizationid)');
    expect(pageSource).not.toContain("organizationorlegacyfilter");
    expect(pageSource).not.toContain("organization_id.is.null");

    expect(actionSource).toContain("requireorganizationaccess");
    expect(actionSource).toContain('.eq("owner_id", profile.owner_id)');
    expect(actionSource).toContain("owner_id: profile.owner_id");
    expect(actionSource).toContain('.eq("organization_id", organization.id)');
    expect(actionSource).not.toContain("organizationorlegacyfilter");
    expect(actionSource).not.toContain("organization_id.is.null");
  });

  it("keeps settings action paths scoped to active organization equality", () => {
    const source = readSource("app/protected/configuracoes/actions.ts");
    const categoryCreate = getFunctionSource(source, "createexpensecategory", "updateexpensecategory");
    const categoryUpdate = getFunctionSource(source, "updateexpensecategory", "deleteexpensecategory");
    const categoryDelete = getFunctionSource(source, "deleteexpensecategory", "deleteexpensecategorywithstate");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain("requireorganizationadmin");
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(categoryCreate).toContain("requireorganizationadmin");
    expect(categoryUpdate).toContain("requireorganizationadmin");
    expect(categoryDelete).toContain("requireorganizationadmin");
    expect(categoryCreate).toContain("owner_id: organization.owner_auth_user_id");
    expect(categoryUpdate).not.toContain('.eq("owner_id"');
    expect(categoryDelete).not.toContain('.eq("owner_id"');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps expense action paths scoped to active organization equality", () => {
    const source = readSource("app/protected/gastos/actions.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).toContain('.eq("organization_id", organizationid)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps payable action paths scoped to active organization equality", () => {
    const source = readSource("app/protected/contas-a-pagar/actions.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).toContain('.eq("organization_id", organizationid)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps receivable action paths scoped to active organization equality", () => {
    const source = readSource("app/protected/contas-a-receber/actions.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).toContain('.eq("organization_id", organizationid)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps bank action paths scoped to active organization equality", () => {
    const source = readSource("app/protected/bancos/actions.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).toContain('.eq("organization_id", organizationid)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("records completed scoped fallback removals", () => {
    const audit = readSource("docs/audits/LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md");

    expect(audit).toContain("#647 admin write validation and deletion boundaries in app/protected/admin/actions.ts");
    expect(audit).toContain("app/protected/admin/actions.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("#648 bank organization helper reads in lib/organizations/banks.ts");
    expect(audit).toContain("lib/organizations/banks.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("#650 category organization helper reads in lib/organizations/categories.ts");
    expect(audit).toContain("lib/organizations/categories.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("#652 payable organization helper reads in lib/organizations/payables.ts");
    expect(audit).toContain("lib/organizations/payables.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("#654 expense organization helper reads in lib/organizations/expenses.ts");
    expect(audit).toContain("lib/organizations/expenses.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("expense member reads from `family_members`");
    expect(audit).toContain("expense category reads from `expense_categories`");
    expect(audit).toContain("expense reads from `expenses`");
    expect(audit).toContain("payable bill reads from `payable_bills`");
    expect(audit).toContain("payable dashboard member reads from `family_members`");
    expect(audit).toContain("receivable organization helper reads in lib/organizations/receivables.ts");
    expect(audit).toContain("lib/organizations/receivables.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("receivable income reads from `receivable_incomes`");
    expect(audit).toContain("receivable dashboard member reads from `family_members`");
    expect(audit).toContain("people organization helper reads in lib/organizations/people.ts");
    expect(audit).toContain("lib/organizations/people.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("people reads from `family_members`");
    expect(audit).toContain("people page and action paths in app/protected/pessoas");
    expect(audit).toContain("app/protected/pessoas no longer accepts legacy null organization rows");
    expect(audit).toContain("linked profile reads from `profiles`");
    expect(audit).toContain("family member update validation and writes");
    expect(audit).toContain("family member status validation and writes");
    expect(audit).toContain("settings action paths in app/protected/configuracoes/actions.ts");
    expect(audit).toContain("app/protected/configuracoes/actions.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("expense category edit validation reads from `expense_categories`");
    expect(audit).toContain("expense category update writes");
    expect(audit).toContain("expense category delete writes");
    expect(audit).toContain("family member monthly limit update writes");
    expect(audit).toContain("expense action paths in app/protected/gastos/actions.ts");
    expect(audit).toContain("app/protected/gastos/actions.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("selected member validation reads from `family_members`");
    expect(audit).toContain("selected category validation reads from `expense_categories`");
    expect(audit).toContain("expense edit/delete validation reads from `expenses`");
    expect(audit).toContain("expense update writes");
    expect(audit).toContain("expense delete writes");
    expect(audit).toContain("payable action paths in app/protected/contas-a-pagar/actions.ts");
    expect(audit).toContain("app/protected/contas-a-pagar/actions.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("payable selected member validation reads from `family_members`");
    expect(audit).toContain("payable edit/delete validation reads from `payable_bills`");
    expect(audit).toContain("payable update writes");
    expect(audit).toContain("payable status update writes");
    expect(audit).toContain("payable delete writes");
    expect(audit).toContain("receivable action paths in app/protected/contas-a-receber/actions.ts");
    expect(audit).toContain("app/protected/contas-a-receber/actions.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("receivable selected member validation reads from `family_members`");
    expect(audit).toContain("receivable edit/delete validation reads from `receivable_incomes`");
    expect(audit).toContain("receivable update writes");
    expect(audit).toContain("receivable status update writes");
    expect(audit).toContain("receivable delete writes");
    expect(audit).toContain("bank action paths in app/protected/bancos/actions.ts");
    expect(audit).toContain("app/protected/bancos/actions.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("bank selected member validation reads from `family_members`");
    expect(audit).toContain("bank edit/delete validation reads from `banks`");
    expect(audit).toContain("bank update writes");
    expect(audit).toContain("bank balance update writes");
    expect(audit).toContain("bank delete writes");
    expect(audit).not.toContain("app/protected/admin/actions.ts still accepts legacy null organization rows");
  });

  it("keeps remaining organization helper fallback work explicit", () => {
    const audit = readSource("docs/audits/LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md");
    const remainingSection = getSection(audit, "## Remaining fallback categories", "## Required next step");

    expect(audit).toContain("must continue one surface at a time");
    expect(audit).toContain("organization_id.eq.<active organization id>,organization_id.is.null");
    expect(remainingSection).toContain("the organization helper files no longer use active organization or legacy null organization filtering");
    expect(remainingSection).toContain("the remaining fallback surfaces are server action read and write-validation paths");
    expect(remainingSection).not.toContain("lib/organizations/expenses.ts");
    expect(remainingSection).not.toContain("lib/organizations/receivables.ts");
    expect(remainingSection).not.toContain("lib/organizations/people.ts");
    expect(remainingSection).not.toContain("lib/organizations/payables.ts");
    expect(remainingSection).not.toContain("app/protected/configuracoes/actions.ts");
    expect(remainingSection).not.toContain("app/protected/pessoas/actions.ts");
    expect(remainingSection).not.toContain("app/protected/gastos/actions.ts");
    expect(remainingSection).not.toContain("app/protected/contas-a-pagar/actions.ts");
    expect(remainingSection).not.toContain("app/protected/contas-a-receber/actions.ts");
    expect(remainingSection).not.toContain("app/protected/bancos/actions.ts");
    expect(audit).toContain("avoid schema, rls, ui, and e2e mixing");
  });
});
