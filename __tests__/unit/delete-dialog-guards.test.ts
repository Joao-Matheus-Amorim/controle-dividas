import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const destructiveDeleteDialogs = [
  "components/finance/expense-delete-dialog.tsx",
  "components/finance/payable-bill-delete-dialog.tsx",
];

describe("destructive delete dialog guards", () => {
  it.each(destructiveDeleteDialogs)("keeps %s as a confirmation Dialog", (path) => {
    const source = readSource(path);

    expect(source).toContain('} from "@/components/ui/dialog"');
    expect(source).toContain("<Dialog");
    expect(source).toContain("<DialogTrigger asChild>");
    expect(source).toContain("<DialogContent");
    expect(source).toContain('name="confirm_delete"');
    expect(source).toContain("isConfirmed");
    expect(source).toContain('type="checkbox"');
    expect(source).not.toContain('} from "@/components/ui/sheet"');
    expect(source).not.toContain("<Sheet");
  });
});
