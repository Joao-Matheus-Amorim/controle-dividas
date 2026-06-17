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
  const dateField = readSource("components/finance/finance-date-field.tsx");
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
    expect(formUi).toContain("h-12 w-full rounded-2xl");
    expect(formUi).toContain("financeInputClass");
    expect(formUi).toContain("financeSelectTriggerClass");
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

  it("keeps finance dates behind an app-like calendar dialog while preserving submitted names", () => {
    expect(dateField).toContain("CalendarDays");
    expect(dateField).toContain("Dialog");
    expect(dateField).toContain('type="hidden"');
    expect(dateField).toContain("formatDateLabel");
    expect(dateField).toContain("Concluir");

    const dateContracts = [
      ["components/finance/expense-form.tsx", "FinanceDateField", 'name="expense_date"'],
      ["components/finance/payable-bill-form.tsx", "FinanceDateField", 'name="due_date"'],
      ["components/finance/receivable-income-form.tsx", "FinanceDateField", 'name="expected_date"'],
    ];

    for (const [formPath, componentName, fieldName] of dateContracts) {
      const source = readSource(formPath);
      expect(source).toContain(componentName);
      expect(source).toContain(fieldName);
      expect(source).not.toContain('type="date"');
    }
  });

  it("uses can_create member options and auto-selects a single allowed member on create", () => {
    const moduleContracts = [
      ["features/protected-pages/gastos-page.tsx", '"GASTOS"', '"can_create"'],
      ["features/protected-pages/contas-a-pagar-page.tsx", '"CONTAS_A_PAGAR"', '"can_create"'],
      ["features/protected-pages/contas-a-receber-page.tsx", '"CONTAS_A_RECEBER"', '"can_create"'],
      ["features/protected-pages/bancos-page.tsx", '"BANCOS"', '"can_create"'],
    ];

    for (const [pagePath, moduleName, actionName] of moduleContracts) {
      const source = readSource(pagePath);
      expect(source).toContain("getAccessibleMemberOptions");
      expect(source).toContain(moduleName);
      expect(source).toContain(actionName);
      expect(source).toContain("members={createMembers}");
    }

    for (const sectionPath of createSections) {
      const source = readSource(sectionPath);
      expect(source).toContain("defaultMemberId");
      expect(source).toContain("members.length === 1");
    }

    for (const formPath of financeForms) {
      const source = readSource(formPath);
      expect(source).toContain("defaultMemberId?: string");
      expect(source).toContain("automaticMember");
      expect(source).toContain('type="hidden"');
      expect(source).toContain("automaticamente pelo seu acesso");
      expect(source).toContain("Selecione uma pessoa");
    }
  });

  it("keeps the shared form sheet responsive for mobile and desktop admin use", () => {
    expect(appFormSheet).toContain("h-12 w-full rounded-2xl");
    expect(appFormSheet).toContain("h-[100dvh]");
    expect(appFormSheet).toContain("md:w-[calc(100vw-2rem)]");
    expect(appFormSheet).toContain("md:max-w-none");
    expect(appFormSheet).not.toContain("md:max-w-md");
    expect(appFormSheet).toContain("SheetClose");
    expect(appFormSheet).toContain("Voltar");
    expect(appFormSheet).toContain("sticky top-0");
    expect(appFormSheet).toContain("flex-1 overflow-y-auto");
  });

  it("keeps fixed payable bills explicit about family or person targeting", () => {
    const payableForm = readSource("components/finance/payable-bill-form.tsx");

    expect(payableForm).toContain("Direcionamento da conta fixa");
    expect(payableForm).toContain("Família inteira");
    expect(payableForm).toContain("Personalizada por pessoa");
    expect(payableForm).toContain('name="fixed_bill_audience"');
    expect(payableForm).toContain("Responsável financeiro");
  });

  it("allows payable and receivable forms to submit custom category labels without schema changes", () => {
    const payableForm = readSource("components/finance/payable-bill-form.tsx");
    const receivableForm = readSource("components/finance/receivable-income-form.tsx");

    expect(payableForm).toContain("customCategoryValue");
    expect(payableForm).toContain("Cadastrar nova categoria");
    expect(payableForm).toContain('name={isCustomCategory ? "category_preset" : "category"}');
    expect(payableForm).toContain('name="category"');
    expect(payableForm).toContain("Digite a categoria");
    expect(payableForm).not.toContain("required={!isCustomCategory}");

    expect(receivableForm).toContain("customIncomeSourceValue");
    expect(receivableForm).toContain("Cadastrar nova origem");
    expect(receivableForm).toContain('name={isCustomSource ? "source_preset" : "source"}');
    expect(receivableForm).toContain('name="source"');
    expect(receivableForm).toContain("Digite a origem");
  });

  it("keeps receivable incomes tracking who or where the payment comes from", () => {
    const receivableForm = readSource("components/finance/receivable-income-form.tsx");
    const receivableActions = readSource("app/protected/contas-a-receber/actions.ts");
    const receivableReadModel = readSource("lib/organizations/receivables.ts");
    const receivableListItem = readSource("components/receivables/receivable-list-item.tsx");
    const migration = readSource("supabase/migrations/056_receivable_incomes_payment_origin.sql");

    expect(receivableForm).toContain('name="payment_origin"');
    expect(receivableForm).toContain("De onde/de quem vem o pagamento");
    expect(receivableForm).toContain("Identifique o pagador ou a origem concreta do dinheiro.");
    expect(receivableActions).toContain('formData.get("payment_origin")');
    expect(receivableActions).toContain("payment_origin: input.paymentOrigin || null");
    expect(receivableReadModel).toContain("payment_origin");
    expect(receivableListItem).toContain("Origem do pagamento:");
    expect(migration).toContain("add column if not exists payment_origin text");
  });

  it("keeps bank account type selection synchronized with submitted data", () => {
    const bankForm = readSource("components/finance/bank-account-form.tsx");

    expect(bankForm).toContain("useState(account?.account_type ?? emptyAccountTypeValue)");
    expect(bankForm).toContain("value={accountTypeValue}");
    expect(bankForm).toContain("onValueChange={setAccountTypeValue}");
    expect(bankForm).toContain('name="account_type_select"');
    expect(bankForm).toContain('name="account_type"');
  });
});
