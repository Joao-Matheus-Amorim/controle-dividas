import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("expense list active overlay guards", () => {
  it("keeps the active expense edit flow on Sheet", () => {
    const source = readSource("components/finance/expense-list-client.tsx");

    expect(source).toContain('} from "@/components/ui/sheet"');
    expect(source).toContain("editingExpense");
    expect(source).toContain("setEditingExpense");
    expect(source).toContain("<Sheet open={Boolean(editingExpense)}");
    expect(source).toContain('<SheetContent side="bottom"');
    expect(source).toContain("<SheetTitle>Editar gasto</SheetTitle>");
    expect(source).toContain('expense={editingExpense} mode="edit"');
  });

  it("keeps the active expense delete confirmation as Dialog", () => {
    const source = readSource("components/finance/expense-list-client.tsx");

    expect(source).toContain('} from "@/components/ui/dialog"');
    expect(source).toContain("deletingExpense");
    expect(source).toContain("isDeleteConfirmed");
    expect(source).toContain("resetDeleteDialog");
    expect(source).toContain("handleDeleteExpense");
    expect(source).toContain("<Dialog open={Boolean(deletingExpense)}");
    expect(source).toContain("<DialogContent>");
    expect(source).toContain("<DialogTitle>Excluir gasto</DialogTitle>");
    expect(source).toContain('name="confirm_delete"');
    expect(source).toContain('type="checkbox"');
  });
});

describe("destructive delete dialog guards", () => {
  it("keeps payable bill delete confirmation as Dialog", () => {
    const source = readSource("components/finance/payable-bill-delete-dialog.tsx");

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
