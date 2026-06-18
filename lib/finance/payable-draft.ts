import { buildExpenseDraftSuggestion } from "@/lib/finance/expense-draft";
import type { DbBankAccount, DbExpenseCategory } from "@/lib/finance/types";

export type PayableBillDraftSuggestion = {
  amount: string;
  bankUsed: string;
  billType: "avulsa" | "fixa";
  category: string;
  dueDate: string;
  name: string;
  notes: string;
  status: "pendente" | "pago" | "atrasado";
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parsePayableStatus(text: string): PayableBillDraftSuggestion["status"] {
  const normalizedText = normalizeText(text);

  if (/\b(?:pago|paga|paguei)\b/.test(normalizedText)) {
    return "pago";
  }

  if (/\b(?:atrasado|venceu)\b/.test(normalizedText)) {
    return "atrasado";
  }

  return "pendente";
}

function parseBillType(text: string): PayableBillDraftSuggestion["billType"] {
  const normalizedText = normalizeText(text);

  return normalizedText.includes("fixa") ||
    normalizedText.includes("mensal") ||
    normalizedText.includes("recorrente")
    ? "fixa"
    : "avulsa";
}

function findBankName(bankId: string, bankAccounts: DbBankAccount[]) {
  return bankAccounts.find((account) => account.id === bankId)?.bank_name ?? "";
}

function findCategoryName(categoryId: string, categories: DbExpenseCategory[]) {
  return categories.find((category) => category.id === categoryId)?.name ?? "";
}

export function buildPayableBillDraftSuggestion(
  text: string,
  categories: DbExpenseCategory[],
  bankAccounts: DbBankAccount[],
  today: string,
): PayableBillDraftSuggestion {
  const baseDraft = buildExpenseDraftSuggestion(text, categories, bankAccounts, today);
  const cleanText = text.trim().replace(/\s+/g, " ");

  return {
    amount: baseDraft.amount,
    bankUsed: findBankName(baseDraft.bankId, bankAccounts),
    billType: parseBillType(cleanText),
    category: findCategoryName(baseDraft.categoryId, categories),
    dueDate: baseDraft.expenseDate,
    name: cleanText.slice(0, 80),
    notes: "Rascunho assistido; confira antes de cadastrar.",
    status: parsePayableStatus(cleanText),
  };
}
