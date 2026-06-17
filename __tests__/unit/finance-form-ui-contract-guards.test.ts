import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

function readNormalized(path: string) {
  return readSource(path)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const formPaths = [
  "components/finance/expense-form.tsx",
  "components/finance/payable-bill-form.tsx",
  "components/finance/receivable-income-form.tsx",
  "components/finance/bank-account-form.tsx",
  "components/finance/family-member-form.tsx",
] as const;

const dialogPaths = [
  "components/finance/expense-form-dialog.tsx",
  "components/finance/payable-bill-form-dialog.tsx",
  "components/finance/receivable-income-form-dialog.tsx",
  "components/finance/bank-account-form-dialog.tsx",
  "components/finance/family-member-form-dialog.tsx",
] as const;

describe("finance form UI contract guards", () => {
  const contract = readNormalized("docs/audits/FINANCE_FORM_UI_CONTRACT.md");

  it("documents the primary finance form contract without broad redesign or snapshots", () => {
    expect(contract).toContain("gap-011");
    expect(contract).toContain("formularios data-changing primarios");
    expect(contract).toContain("useactionstate");
    expect(contract).toContain("appactionfeedback");
    expect(contract).toContain("ispending");
    expect(contract).toContain("appformsheet");
    expect(contract).toContain("nao");
    expect(contract).toContain("snapshot visual amplo");
    expect(contract).toContain("redesenha formularios");
  });

  it.each(formPaths)("keeps %s wired to action feedback and pending submit state", (path) => {
    const source = readSource(path);

    expect(source).toContain("useActionState");
    expect(source).toContain("AppActionFeedback");
    expect(source).toContain("Button");
    expect(source).toContain("disabled={isPending}");
    expect(source).toContain("Salvando...");
    expect(source).toContain("<Label htmlFor=");
    expect(source).toContain("name=");
  });

  it.each(dialogPaths)("keeps %s using the shared AppFormSheet create surface", (path) => {
    const source = readSource(path);

    expect(source).toContain("AppFormSheet");
    expect(source).toContain("triggerLabel=");
    expect(source).toContain("description=");
    expect(source).toContain("icon=");
  });

  it("keeps expense form create/edit fields and hidden edit id", () => {
    const source = readSource("components/finance/expense-form.tsx");

    expect(source).toContain("createExpense");
    expect(source).toContain("updateExpense");
    expect(source).toContain('mode?: "create" | "edit"');
    expect(source).toContain('name="id"');
    expect(source).toContain('name="family_member_id"');
    expect(source).toContain('name="category_id"');
    expect(source).toContain('name="expense_date"');
    expect(source).toContain('name="amount"');
    expect(source).toContain('name="description"');
    expect(source).toContain('name="purchase_location"');
    expect(source).toContain('name="payment_method"');
    expect(source).toContain('name="bank_or_card"');
    expect(source).toContain('name="notes"');
  });

  it("keeps payable form bill type, recurrence, create/edit fields, and hidden edit id", () => {
    const source = readSource("components/finance/payable-bill-form.tsx");

    expect(source).toContain("createPayableBill");
    expect(source).toContain("updatePayableBill");
    expect(source).toContain("useState<PayableBillType>");
    expect(source).toContain('value="avulsa"');
    expect(source).toContain('value="fixa"');
    expect(source).toContain('name="id"');
    expect(source).toContain('name="name"');
    expect(source).toContain('name="category"');
    expect(source).toContain('name="amount"');
    expect(source).toContain('name="due_date"');
    expect(source).toContain('name="responsible_member_id"');
    expect(source).toContain('name="status"');
    expect(source).toContain('name="bank_used"');
    expect(source).toContain('name="recurrence"');
    expect(source).toContain("disabled={billType === \"avulsa\"}");
  });

  it("keeps receivable form create/edit fields and status controls", () => {
    const source = readSource("components/finance/receivable-income-form.tsx");
    const normalized = readNormalized("components/finance/receivable-income-form.tsx");

    expect(source).toContain("createReceivableIncome");
    expect(source).toContain("updateReceivableIncome");
    expect(source).toContain('name="id"');
    expect(source).toContain('name="receiver_member_id"');
    expect(source).toContain('name="source"');
    expect(source).toContain('name="income_type"');
    expect(source).toContain('name="amount"');
    expect(source).toContain('name="expected_date"');
    expect(source).toContain('name="status"');
    expect(source).toContain('name="receiving_bank"');
    expect(source).toContain('name="notes"');
    expect(source).toContain('<SelectItem value="previsto">');
    expect(source).toContain('<SelectItem value="recebido">');
    expect(normalized).toContain("renda fixa");
    expect(normalized).toContain("salario");
    expect(normalized).toContain("comissao");
    expect(normalized).toContain("freelance / servicos");
    expect(normalized).toContain("aluguel recebido");
    expect(normalized).toContain("variavel / pontual");
    expect(source).toContain("legacyIncomeSourceLabels");
  });

  it("keeps bank account form create/edit fields and account type bridge", () => {
    const source = readSource("components/finance/bank-account-form.tsx");

    expect(source).toContain("createBankAccount");
    expect(source).toContain("updateBankAccount");
    expect(source).toContain("emptyAccountTypeValue");
    expect(source).toContain("systemBankOptions");
    expect(source).toContain("isSystemBankOption");
    expect(source).toContain('name="id"');
    expect(source).toContain('name="family_member_id"');
    expect(source).toContain('name="bank_name"');
    expect(source).toContain("Selecione um banco");
    expect(source).toContain('name="account_type_select"');
    expect(source).toContain('name="account_type"');
    expect(source).toContain('type="hidden"');
    expect(source).toContain('name="current_balance"');
    expect(source).toContain('name="currency"');
    expect(source).toContain('name="notes"');
    expect(source).not.toContain('placeholder="Ex: Revolut, Wise"');
  });

  it("keeps family member form minimal create contract", () => {
    const source = readSource("components/finance/family-member-form.tsx");

    expect(source).toContain("createFamilyMember");
    expect(source).toContain('name="name"');
    expect(source).toContain('name="role"');
    expect(source).toContain('name="monthly_limit"');
    expect(source).toContain('type="number"');
    expect(source).toContain('min="0"');
  });

  it("keeps expense category create submit inline and edit sheet submit fixed", () => {
    const form = readSource("components/finance/expense-category-form.tsx");
    const settings = readSource("components/settings/settings-categories.tsx");
    const editDialog = readSource("components/finance/expense-category-edit-dialog.tsx");

    expect(form).toContain('submitLayout?: "inline" | "sheet"');
    expect(form).toContain('submitLayout = "inline"');
    expect(form).toContain("financeInlineSubmitBarClass");
    expect(form).toContain("submitLayout === \"sheet\" ? financeSubmitBarClass : financeInlineSubmitBarClass");
    expect(settings).toContain("<ExpenseCategoryForm />");
    expect(editDialog).toContain('submitLayout="sheet"');
  });
});
