import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const editFormWrappers = [
  "components/finance/payable-bill-edit-dialog.tsx",
  "components/finance/bank-account-edit-dialog.tsx",
  "components/finance/expense-category-edit-dialog.tsx",
  "components/finance/receivable-income-edit-dialog.tsx",
];

describe("edit form sheet guards", () => {
  it.each(editFormWrappers)("keeps %s on the shared AppFormSheet edit surface", (path) => {
    const source = readSource(path);

    expect(source).toContain('import { AppFormSheet } from "@/components/app/app-form-sheet"');
    expect(source).toContain("<AppFormSheet");
    expect(source).toContain("triggerLabel=");
    expect(source).toContain("description=");
    expect(source).toContain("trigger={");
    expect(source).toContain("</AppFormSheet>");
    expect(source).not.toContain('} from "@/components/ui/sheet"');
    expect(source).not.toContain('} from "@/components/ui/dialog"');
    expect(source).not.toContain("<Dialog>");
    expect(source).not.toContain("<DialogContent");
  });
});
