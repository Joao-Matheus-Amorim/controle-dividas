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

  it("closes primary finance create sheets after successful saves", () => {
    const primaryCreateDialogs = [
      "components/finance/expense-form-dialog.tsx",
      "components/finance/payable-bill-form-dialog.tsx",
      "components/finance/receivable-income-form-dialog.tsx",
      "components/finance/bank-account-form-dialog.tsx",
    ];

    for (const path of primaryCreateDialogs) {
      const source = readSource(path);

      expect(source).toContain("useState");
      expect(source).toContain("open={open}");
      expect(source).toContain("onOpenChange={");
      expect(source).toContain("function handleSuccess()");
      expect(source).toContain("setOpen(false)");
      expect(source).toContain("setFormKey");
      expect(source).toContain("onSuccess={handleSuccess}");
    }
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
    expect(source).toContain('name="payment_form"');
    expect(source).toContain('name="recurrence"');
    expect(source).toContain('name="recorded_timezone"');
    expect(source).toContain("captureRecordedTimezone");
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
    expect(source).toContain('name="category"');
    expect(source).toContain('name="income_type"');
    expect(source).toContain('name="amount"');
    expect(source).toContain('name="expected_date"');
    expect(source).toContain('name="status"');
    expect(source).toContain('name="receiving_bank"');
    expect(source).toContain('name="payment_form"');
    expect(source).toContain('name="recorded_timezone"');
    expect(source).toContain("captureRecordedTimezone");
    expect(source).toContain('name="notes"');
    expect(source).toContain('<SelectItem value="previsto">');
    expect(source).toContain('<SelectItem value="recebido">');
    expect(source).toContain("sources?: DbReceivableIncomeSource[]");
    expect(source).toContain(">Origem</Label>");
    expect(source).toContain("required");
    expect(source).toContain(">Categoria</Label>");
    expect(source).toContain("Classifique a entrada para relatórios e filtros.");
    expect(source).not.toContain('name="payment_origin"');
    expect(source).not.toContain("customIncomeSourceValue");
    expect(normalized).toContain("variavel / pontual");
    expect(source).not.toContain("legacyIncomeSourceLabels");
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

  it("keeps finance bank usage fields tied to registered bank options", () => {
    const payableForm = readSource("components/finance/payable-bill-form.tsx");
    const receivableForm = readSource("components/finance/receivable-income-form.tsx");
    const expenseForm = readSource("components/finance/expense-form.tsx");
    const payableActions = readSource("app/protected/contas-a-pagar/actions.ts");
    const receivableActions = readSource("app/protected/contas-a-receber/actions.ts");
    const expenseActions = readSource("app/protected/gastos/actions.ts");

    expect(payableForm).toContain("bankAccounts?: DbBankAccount[]");
    expect(payableForm).toContain("memberBankAccounts.map");
    expect(payableForm).toContain("keepsLegacyBankUsed");
    expect(payableForm).toContain('name="bank_used"');
    expect(payableForm).toContain("Selecione a carteira Dinheiro");
    expect(payableForm).toContain("carteira Dinheiro cadastrada");
    expect(payableForm).not.toContain('placeholder="Ex: Revolut, Wise"');

    expect(receivableForm).toContain("bankAccounts?: DbBankAccount[]");
    expect(receivableForm).toContain("memberBankAccounts.map");
    expect(receivableForm).toContain("keepsLegacyReceivingBank");
    expect(receivableForm).toContain('name="receiving_bank"');
    expect(receivableForm).toContain("Selecione a carteira Dinheiro");
    expect(receivableForm).toContain("carteira Dinheiro cadastrada");
    expect(receivableForm).not.toContain('placeholder="Ex: Revolut, Wise"');

    expect(expenseForm).toContain("bankAccounts?: DbBankAccount[]");
    expect(expenseForm).toContain("memberBankAccounts.map");
    expect(expenseForm).toContain("keepsLegacyBankOrCard");
    expect(expenseForm).toContain('name="bank_or_card"');
    expect(expenseForm).toContain("Selecione a carteira Dinheiro");
    expect(expenseForm).toContain("carteira Dinheiro cadastrada");

    expect(payableActions).toContain("assertBankNameBelongsToResponsibleMember");
    expect(payableActions).toContain(".limit(1)");
    expect(payableActions).toContain("Selecione um banco cadastrado para o responsavel desta conta.");
    expect(receivableActions).toContain("assertBankNameBelongsToReceiverMember");
    expect(receivableActions).toContain(".limit(1)");
    expect(receivableActions).toContain("Selecione um banco cadastrado para a pessoa recebedora.");
    expect(expenseActions).toContain("assertBankNameBelongsToExpenseMember");
    expect(expenseActions).toContain(".limit(1)");
    expect(expenseActions).toContain("Selecione um banco cadastrado para a pessoa responsavel pelo gasto.");
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
    expect(settings).toContain("Use as categorias padrao sempre que possivel");
    expect(settings).not.toContain("ExpenseCategoryForm");
    expect(editDialog).toContain('submitLayout="sheet"');
  });

  it("uses AI draft category/source ids to preselect existing options in create forms", () => {
    const payable = readSource("components/finance/payable-bill-form.tsx");
    const receivable = readSource("components/finance/receivable-income-form.tsx");

    expect(payable).toContain("draftData?.categoryId");
    expect(payable).toContain("categories.find((category) => category.id === draftData.categoryId)?.name");
    expect(receivable).toContain("draftData?.sourceId");
    expect(receivable).toContain("sources.find((source) => source.id === draftData.sourceId)?.name");
    expect(receivable).toContain('name="category"');
  });
});
