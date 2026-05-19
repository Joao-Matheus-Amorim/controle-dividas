import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const editFormWrappers = [
  "components/finance/expense-edit-dialog.tsx",
  "components/finance/payable-bill-edit-dialog.tsx",
  "components/finance/bank-account-edit-dialog.tsx",
  "components/finance/expense-category-edit-dialog.tsx",
  "components/finance/receivable-income-edit-dialog.tsx",
];

describe("edit form sheet guards", () => {
  it.each(editFormWrappers)("keeps %s on Sheet", (path) => {
    const source = readSource(path);

    expect(source).toContain('} from "@/components/ui/sheet"');
    expect(source).toContain("<Sheet>");
    expect(source).toContain("<SheetTrigger asChild>");
    expect(source).toContain('<SheetContent side="bottom"');
    expect(source).toContain("<SheetHeader>");
    expect(source).toContain("</Sheet>");
    expect(source).not.toContain('} from "@/components/ui/dialog"');
    expect(source).not.toContain("<Dialog>");
    expect(source).not.toContain("<DialogContent");
  });
});
