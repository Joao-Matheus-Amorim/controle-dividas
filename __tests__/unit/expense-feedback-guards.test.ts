import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("expense feedback guards", () => {
  it("keeps expense delete action returning feedback state", () => {
    const source = readSource("app/protected/gastos/actions.ts");

    expect(source).toContain("export type ExpenseActionState");
    expect(source).toContain("export async function deleteExpense");
    expect(source).toContain("Promise<ExpenseActionState>");
    expect(source).toContain('return { error: "Gasto nao encontrado." };');
    expect(source).toContain(
      'return { error: "Confirme a exclusao antes de continuar." };',
    );
    expect(source).toContain('return { success: "Gasto excluido com sucesso." };');
    expect(source).toContain('"Nao foi possivel excluir este gasto."');
    expect(source).not.toContain("catch {\n    return;\n  }");
  });

  it("keeps active expense list rendering delete action feedback", () => {
    const source = readSource("components/finance/expense-list-client.tsx");

    expect(source).toContain(
      'import { AppActionFeedback } from "@/components/app/app-action-feedback";',
    );
    expect(source).toContain("type ExpenseActionState");
    expect(source).toContain("deleteState");
    expect(source).toContain("setDeleteState");
    expect(source).toContain("initialDeleteState");
    expect(source).toContain("const result = await deleteExpense(formData);");
    expect(source).toContain("setDeleteState(result);");
    expect(source).toContain("if (result.success)");

    expect(source).toContain("<AppActionFeedback");
    expect(source).toContain("error={deleteState.error}");
    expect(source).toContain("success={deleteState.success}");
  });
});