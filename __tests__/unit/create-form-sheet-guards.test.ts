import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const createFormWrappers = [
  "components/finance/family-member-form-dialog.tsx",
  "components/finance/expense-form-dialog.tsx",
  "components/finance/payable-bill-form-dialog.tsx",
  "components/finance/bank-account-form-dialog.tsx",
  "components/finance/receivable-income-form-dialog.tsx",
  "components/finance/family-user-form-dialog.tsx",
];

describe("create form sheet guards", () => {
  it.each(createFormWrappers)("keeps %s on AppFormSheet", (path) => {
    const source = readSource(path);

    expect(source).toContain('import { AppFormSheet } from "@/components/app/app-form-sheet"');
    expect(source).toContain("<AppFormSheet");
    expect(source).toContain("</AppFormSheet>");
    expect(source).not.toContain("AppFormDialog");
  });
});
