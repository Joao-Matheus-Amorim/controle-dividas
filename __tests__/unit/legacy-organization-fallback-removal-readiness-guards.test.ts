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

describe("legacy organization fallback removal readiness", () => {
  it("keeps admin actions scoped to active organization equality", () => {
    const source = readSource("app/protected/admin/actions.ts");

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", adminprofile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
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

    expect(source).toContain("requireorganizationaccess");
    expect(source).toContain('.eq("owner_id", profile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationorlegacyfilter");
    expect(source).not.toContain("organization_id.is.null");
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
    expect(audit).not.toContain("app/protected/admin/actions.ts still accepts legacy null organization rows");
  });

  it("keeps remaining organization helper fallback work explicit", () => {
    const audit = readSource("docs/audits/LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md");
    const remainingSection = getSection(audit, "## Remaining fallback categories", "## Required next step");

    expect(audit).toContain("must continue one surface at a time");
    expect(audit).toContain("organization_id.eq.<active organization id>,organization_id.is.null");
    expect(remainingSection).toContain("the remaining organization helper files still use active organization or legacy null organization filtering");
    expect(remainingSection).not.toContain("lib/organizations/expenses.ts");
    expect(remainingSection).toContain("lib/organizations/receivables.ts");
    expect(remainingSection).toContain("lib/organizations/people.ts");
    expect(remainingSection).not.toContain("lib/organizations/payables.ts");
    expect(audit).toContain("avoid schema, rls, ui, and e2e mixing");
  });
});
