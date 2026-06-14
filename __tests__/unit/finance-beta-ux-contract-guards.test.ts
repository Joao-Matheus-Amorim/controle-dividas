import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("finance beta UX contract guards", () => {
  const createCard = readSource("components/finance/finance-create-card.tsx");
  const formUi = readSource("components/finance/finance-form-ui.ts");
  const appFormSheet = readSource("components/app/app-form-sheet.tsx");

  const financePages = [
    "features/protected-pages/gastos-page.tsx",
    "features/protected-pages/contas-a-pagar-page.tsx",
    "features/protected-pages/contas-a-receber-page.tsx",
    "features/protected-pages/bancos-page.tsx",
  ];

  const createSections = [
    "components/expenses/expense-create-section.tsx",
    "components/payables/payable-create-section.tsx",
    "components/receivables/receivable-create-section.tsx",
    "components/banks/bank-create-section.tsx",
  ];

  const financeForms = [
    "components/finance/expense-form.tsx",
    "components/finance/payable-bill-form.tsx",
    "components/finance/receivable-income-form.tsx",
    "components/finance/bank-account-form.tsx",
  ];

  it("keeps finance create cards app-like and blocks data forms until people exist", () => {
    expect(createCard).toContain("memberCount > 0");
    expect(createCard).toContain("Cadastrar pessoa");
    expect(createCard).toContain("Cadastre uma pessoa antes de criar lancamentos financeiros.");
    expect(createCard).toContain("Pessoas definem responsavel, permissao e escopo dos dados.");
    expect(createCard).toContain("h-12 w-full");
    expect(createCard).toContain("sm:min-w-[12rem]");
  });

  it("preserves active organization links for the people prerequisite CTA", () => {
    for (const pagePath of financePages) {
      expect(readSource(pagePath)).toContain("orgSlug={orgSlug}");
    }

    for (const sectionPath of createSections) {
      const source = readSource(sectionPath);
      expect(source).toContain("FinanceCreateCard");
      expect(source).toContain("getOrgPathFromProtectedPath");
      expect(source).toContain('"/protected/pessoas"');
      expect(source).not.toContain('href="/protected/pessoas"');
    }
  });

  it("keeps finance forms using the shared mobile form surface", () => {
    expect(formUi).toContain("financeNativeSelectClass");
    expect(formUi).toContain("h-11 w-full rounded-2xl");
    expect(formUi).toContain("financeSubmitBarClass");
    expect(formUi).toContain("fixed inset-x-0 bottom-0");
    expect(formUi).toContain("financeSubmitButtonClass");

    for (const formPath of financeForms) {
      const source = readSource(formPath);
      expect(source).toContain("financeFormClass");
      expect(source).toContain("financeSubmitBarClass");
      expect(source).toContain("financeSubmitButtonClass");
    }
  });

  it("keeps the shared form sheet structured as a mobile bottom sheet", () => {
    expect(appFormSheet).toContain("h-12 w-full rounded-2xl");
    expect(appFormSheet).toContain("max-h-[92vh]");
    expect(appFormSheet).toContain("flex max-h-[92vh] flex-col overflow-hidden");
    expect(appFormSheet).toContain("sticky top-0");
    expect(appFormSheet).toContain("flex-1 overflow-y-auto");
  });

  it("keeps bank account type selection synchronized with submitted data", () => {
    const bankForm = readSource("components/finance/bank-account-form.tsx");

    expect(bankForm).toContain("useState(account?.account_type ?? emptyAccountTypeValue)");
    expect(bankForm).toContain("value={accountTypeValue}");
    expect(bankForm).toContain("onValueChange={setAccountTypeValue}");
    expect(bankForm).toContain('name="account_type"');
    expect(bankForm).not.toContain('name="account_type_select"');
  });
});
