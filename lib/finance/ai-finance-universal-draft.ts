import { buildBankAccountDraftSuggestion } from "@/lib/finance/bank-draft";
import { buildExpenseDraftSuggestion } from "@/lib/finance/expense-draft";
import {
  classifyAiFinanceIntent,
  type AiFinanceIntentClassification,
} from "@/lib/finance/ai-finance-intent-classifier";
import type { AiFinanceIntent, AiFinanceIntakeDraft } from "@/lib/finance/ai-finance-intake-schema";
import { buildPayableBillDraftSuggestion } from "@/lib/finance/payable-draft";
import { buildReceivableIncomeDraftSuggestion } from "@/lib/finance/receivable-draft";
import type { DbBankAccount, DbExpenseCategory, DbReceivableIncomeSource } from "@/lib/finance/types";

export type AiFinanceUniversalDraftCatalogs = {
  expenseCategories?: DbExpenseCategory[];
  receivableSources?: DbReceivableIncomeSource[];
  bankAccounts?: DbBankAccount[];
};

export type AiFinanceUniversalDraftBoundary = {
  mode: "review_only";
  provider: "none";
  reviewRequired: true;
  canAutoSave: false;
  directSaveAction: null;
  classification: AiFinanceIntentClassification;
  draft: AiFinanceIntakeDraft | null;
  missingFields: string[];
  errors: string[];
  nextStep: string;
};

type BuildAiFinanceUniversalDraftInput = {
  text: string;
  today: string;
  catalogs?: AiFinanceUniversalDraftCatalogs;
};

const requiredFieldsByIntent: Record<AiFinanceIntent, string[]> = {
  gasto: ["memberId", "categoryId", "amount", "date", "description"],
  conta_a_pagar: ["memberId", "categoryId", "name", "amount", "dueDate", "status", "billType"],
  conta_a_receber: ["memberId", "sourceId", "amount", "expectedDate", "status", "incomeType"],
  banco: ["memberId", "bankName", "accountType", "currentBalance", "currency"],
};

function toNumber(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : undefined;
}

function missingFieldsForDraft(intent: AiFinanceIntent, draft: Partial<AiFinanceIntakeDraft>) {
  const draftRecord = draft as Record<string, unknown>;

  return requiredFieldsByIntent[intent].filter((field) => {
    const value = draftRecord[field];
    return value === undefined || value === null || value === "";
  });
}

function findCategoryIdByName(name: string, categories: DbExpenseCategory[]) {
  return categories.find((category) => category.name === name)?.id;
}

function findSourceIdByName(name: string, sources: DbReceivableIncomeSource[]) {
  return sources.find((source) => source.name === name)?.id;
}

function findBankIdByName(name: string, bankAccounts: DbBankAccount[]) {
  return bankAccounts.find((account) => account.bank_name === name)?.id;
}

function buildBlockedBoundary(
  classification: AiFinanceIntentClassification,
  nextStep: string,
): AiFinanceUniversalDraftBoundary {
  return {
    mode: "review_only",
    provider: "none",
    reviewRequired: true,
    canAutoSave: false,
    directSaveAction: null,
    classification,
    draft: null,
    missingFields: [],
    errors: [],
    nextStep,
  };
}

export function buildAiFinanceUniversalDraft({
  text,
  today,
  catalogs = {},
}: BuildAiFinanceUniversalDraftInput): AiFinanceUniversalDraftBoundary {
  const classification = classifyAiFinanceIntent(text);

  if (classification.intent === "pergunta") {
    return buildBlockedBoundary(
      classification,
      "Perguntas financeiras devem usar somente acoes read-only permitidas.",
    );
  }

  if (classification.intent === "recusa") {
    return buildBlockedBoundary(
      classification,
      "Pedido recusado em modo seguro; nenhuma acao foi executada.",
    );
  }

  const expenseCategories = catalogs.expenseCategories ?? [];
  const receivableSources = catalogs.receivableSources ?? [];
  const bankAccounts = catalogs.bankAccounts ?? [];
  let draft: AiFinanceIntakeDraft;

  if (classification.intent === "gasto") {
    const suggestion = buildExpenseDraftSuggestion(text, expenseCategories, bankAccounts, today);
    draft = {
      intent: "gasto",
      amount: toNumber(suggestion.amount),
      categoryId: suggestion.categoryId || undefined,
      date: suggestion.expenseDate || undefined,
      description: suggestion.description || undefined,
      bankId: suggestion.bankId || undefined,
      paymentMethod: suggestion.paymentMethod || undefined,
      purchaseLocation: suggestion.purchaseLocation || undefined,
      notes: suggestion.notes,
    };
  } else if (classification.intent === "conta_a_pagar") {
    const suggestion = buildPayableBillDraftSuggestion(text, expenseCategories, bankAccounts, today);
    draft = {
      intent: "conta_a_pagar",
      amount: toNumber(suggestion.amount),
      categoryId: findCategoryIdByName(suggestion.category, expenseCategories),
      dueDate: suggestion.dueDate || undefined,
      name: suggestion.name || undefined,
      bankId: findBankIdByName(suggestion.bankUsed, bankAccounts),
      billType: suggestion.billType,
      notes: suggestion.notes,
      status: suggestion.status,
    };
  } else if (classification.intent === "conta_a_receber") {
    const suggestion = buildReceivableIncomeDraftSuggestion(text, receivableSources, bankAccounts, today);
    draft = {
      intent: "conta_a_receber",
      amount: toNumber(suggestion.amount),
      expectedDate: suggestion.expectedDate || undefined,
      incomeType: suggestion.incomeType,
      notes: suggestion.notes,
      paymentOrigin: suggestion.paymentOrigin || undefined,
      bankId: findBankIdByName(suggestion.receivingBank, bankAccounts),
      sourceId: findSourceIdByName(suggestion.source, receivableSources),
      status: suggestion.status,
    };
  } else {
    const suggestion = buildBankAccountDraftSuggestion(text);
    draft = {
      intent: "banco",
      accountType: suggestion.accountType || undefined,
      bankName: suggestion.bankName || undefined,
      currentBalance: toNumber(suggestion.currentBalance),
      currency: suggestion.currency || undefined,
      notes: suggestion.notes,
    };
  }

  const missingFields = missingFieldsForDraft(classification.intent, draft);

  return {
    mode: "review_only",
    provider: "none",
    reviewRequired: true,
    canAutoSave: false,
    directSaveAction: null,
    classification,
    draft,
    missingFields,
    errors: [],
    nextStep: missingFields.length > 0
      ? "Revise o rascunho e preencha os campos obrigatorios faltantes antes de salvar."
      : "Revise todos os campos antes de confirmar no formulario financeiro.",
  };
}
