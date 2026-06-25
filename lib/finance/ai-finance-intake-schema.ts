export const aiFinanceIntents = [
  "gasto",
  "conta_a_pagar",
  "conta_a_receber",
  "banco",
] as const;

export type AiFinanceIntent = (typeof aiFinanceIntents)[number];

export type AiFinanceCatalogOption = {
  id: string;
  name: string;
};

export type AiFinanceBankCatalogOption = AiFinanceCatalogOption & {
  familyMemberId?: string | null;
};

export type AiFinanceIntakeCatalogs = {
  members: AiFinanceCatalogOption[];
  expenseCategories: AiFinanceCatalogOption[];
  receivableSources: AiFinanceCatalogOption[];
  bankAccounts: AiFinanceBankCatalogOption[];
  currencies?: string[];
};

export type AiFinanceExpenseDraft = {
  intent: "gasto";
  memberId?: string;
  categoryId?: string;
  amount?: number;
  date?: string;
  description?: string;
  bankId?: string;
  paymentMethod?: string;
  purchaseLocation?: string;
  notes?: string;
};

export type AiFinancePayableDraft = {
  intent: "conta_a_pagar";
  memberId?: string;
  categoryId?: string;
  name?: string;
  amount?: number;
  dueDate?: string;
  status?: "pendente" | "pago" | "atrasado";
  billType?: "fixa" | "avulsa";
  bankId?: string;
  recurrence?: string;
  notes?: string;
};

export type AiFinanceReceivableDraft = {
  intent: "conta_a_receber";
  memberId?: string;
  sourceId?: string;
  amount?: number;
  expectedDate?: string;
  status?: "previsto" | "recebido" | "atrasado";
  incomeType?: "fixa" | "variavel";
  bankId?: string;
  paymentOrigin?: string;
  notes?: string;
};

export type AiFinanceBankDraft = {
  intent: "banco";
  memberId?: string;
  bankName?: string;
  accountType?: string;
  currentBalance?: number;
  currency?: string;
  notes?: string;
};

export type AiFinanceIntakeDraft =
  | AiFinanceExpenseDraft
  | AiFinancePayableDraft
  | AiFinanceReceivableDraft
  | AiFinanceBankDraft;

export type AiFinanceIntakeValidationResult =
  | {
      ok: true;
      draft: AiFinanceIntakeDraft;
      missingFields: [];
      errors: [];
    }
  | {
      ok: false;
      draft: AiFinanceIntakeDraft | null;
      missingFields: string[];
      errors: string[];
    };

const payableStatuses = ["pendente", "pago", "atrasado"] as const;
const receivableStatuses = ["previsto", "recebido", "atrasado"] as const;
const payableTypes = ["fixa", "avulsa"] as const;
const receivableTypes = ["fixa", "variavel"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveAmount(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

function isDateToken(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isCurrencyToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function hasOption(options: AiFinanceCatalogOption[], id: string | undefined) {
  return Boolean(id && options.some((option) => option.id === id));
}

function hasBankOption(options: AiFinanceBankCatalogOption[], id: string | undefined) {
  return Boolean(id && options.some((option) => option.id === id));
}

function findBankOption(options: AiFinanceBankCatalogOption[], id: string | undefined) {
  return id ? options.find((option) => option.id === id) ?? null : null;
}

function addRequiredString(
  value: unknown,
  field: string,
  missingFields: string[],
  errors: string[],
) {
  if (!isNonEmptyString(value)) {
    missingFields.push(field);
    return;
  }

  if (value.trim() !== value) {
    errors.push(`${field} must be trimmed`);
  }
}

function addPositiveAmount(
  value: unknown,
  field: string,
  missingFields: string[],
  errors: string[],
) {
  if (value === undefined || value === null) {
    missingFields.push(field);
    return;
  }

  if (!isPositiveAmount(value)) {
    errors.push(`${field} must be a positive number`);
  }
}

function addDate(
  value: unknown,
  field: string,
  missingFields: string[],
  errors: string[],
) {
  if (!isNonEmptyString(value)) {
    missingFields.push(field);
    return;
  }

  if (!isDateToken(value)) {
    errors.push(`${field} must use YYYY-MM-DD`);
  }
}

function addCatalogId(
  value: unknown,
  field: string,
  options: AiFinanceCatalogOption[],
  missingFields: string[],
  errors: string[],
) {
  if (!isNonEmptyString(value)) {
    missingFields.push(field);
    return;
  }

  if (!hasOption(options, value)) {
    errors.push(`${field} is not in the active organization catalog`);
  }
}

function addOptionalBankId(
  value: unknown,
  field: string,
  options: AiFinanceBankCatalogOption[],
  memberId: string | undefined,
  errors: string[],
) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!isNonEmptyString(value) || !hasBankOption(options, value)) {
    errors.push(`${field} is not in the active organization bank catalog`);
    return;
  }

  const bank = findBankOption(options, value);
  if (bank?.familyMemberId && memberId && bank.familyMemberId !== memberId) {
    errors.push(`${field} does not belong to the selected member`);
  }
}

function addEnum<T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T,
  missingFields: string[],
  errors: string[],
) {
  if (!isNonEmptyString(value)) {
    missingFields.push(field);
    return;
  }

  if (!isOneOf(value, allowed)) {
    errors.push(`${field} must be one of ${allowed.join(", ")}`);
  }
}

function validateExpenseDraft(
  draft: AiFinanceExpenseDraft,
  catalogs: AiFinanceIntakeCatalogs,
  missingFields: string[],
  errors: string[],
) {
  addCatalogId(draft.memberId, "memberId", catalogs.members, missingFields, errors);
  addCatalogId(draft.categoryId, "categoryId", catalogs.expenseCategories, missingFields, errors);
  addPositiveAmount(draft.amount, "amount", missingFields, errors);
  addDate(draft.date, "date", missingFields, errors);
  addRequiredString(draft.description, "description", missingFields, errors);
  addOptionalBankId(draft.bankId, "bankId", catalogs.bankAccounts, draft.memberId, errors);
}

function validatePayableDraft(
  draft: AiFinancePayableDraft,
  catalogs: AiFinanceIntakeCatalogs,
  missingFields: string[],
  errors: string[],
) {
  addCatalogId(draft.memberId, "memberId", catalogs.members, missingFields, errors);
  addCatalogId(draft.categoryId, "categoryId", catalogs.expenseCategories, missingFields, errors);
  addRequiredString(draft.name, "name", missingFields, errors);
  addPositiveAmount(draft.amount, "amount", missingFields, errors);
  addDate(draft.dueDate, "dueDate", missingFields, errors);
  addOptionalBankId(draft.bankId, "bankId", catalogs.bankAccounts, draft.memberId, errors);
  addEnum(draft.status, "status", payableStatuses, missingFields, errors);
  addEnum(draft.billType, "billType", payableTypes, missingFields, errors);
}

function validateReceivableDraft(
  draft: AiFinanceReceivableDraft,
  catalogs: AiFinanceIntakeCatalogs,
  missingFields: string[],
  errors: string[],
) {
  addCatalogId(draft.memberId, "memberId", catalogs.members, missingFields, errors);
  addCatalogId(draft.sourceId, "sourceId", catalogs.receivableSources, missingFields, errors);
  addPositiveAmount(draft.amount, "amount", missingFields, errors);
  addDate(draft.expectedDate, "expectedDate", missingFields, errors);
  addOptionalBankId(draft.bankId, "bankId", catalogs.bankAccounts, draft.memberId, errors);
  addEnum(draft.status, "status", receivableStatuses, missingFields, errors);
  addEnum(draft.incomeType, "incomeType", receivableTypes, missingFields, errors);
}

function validateBankDraft(
  draft: AiFinanceBankDraft,
  catalogs: AiFinanceIntakeCatalogs,
  missingFields: string[],
  errors: string[],
) {
  addCatalogId(draft.memberId, "memberId", catalogs.members, missingFields, errors);
  addRequiredString(draft.bankName, "bankName", missingFields, errors);
  addRequiredString(draft.accountType, "accountType", missingFields, errors);

  if (draft.currentBalance === undefined || draft.currentBalance === null) {
    missingFields.push("currentBalance");
  } else if (!isNumber(draft.currentBalance)) {
    errors.push("currentBalance must be a finite number");
  }

  if (!isNonEmptyString(draft.currency)) {
    missingFields.push("currency");
  } else if (!isCurrencyToken(draft.currency)) {
    errors.push("currency must be an ISO 4217 token");
  } else if (catalogs.currencies?.length && !catalogs.currencies.includes(draft.currency)) {
    errors.push("currency is not in the allowed currency catalog");
  }
}

function normalizeDraft(input: Record<string, unknown>): AiFinanceIntakeDraft | null {
  if (!isOneOf(input.intent, aiFinanceIntents)) {
    return null;
  }

  return { ...input, intent: input.intent } as AiFinanceIntakeDraft;
}

export function validateAiFinanceIntakeDraft(
  input: unknown,
  catalogs: AiFinanceIntakeCatalogs,
): AiFinanceIntakeValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      draft: null,
      missingFields: [],
      errors: ["draft must be an object"],
    };
  }

  const draft = normalizeDraft(input);
  if (!draft) {
    return {
      ok: false,
      draft: null,
      missingFields: ["intent"],
      errors: ["intent must be one of gasto, conta_a_pagar, conta_a_receber, banco"],
    };
  }

  const missingFields: string[] = [];
  const errors: string[] = [];

  if (draft.intent === "gasto") {
    validateExpenseDraft(draft, catalogs, missingFields, errors);
  }

  if (draft.intent === "conta_a_pagar") {
    validatePayableDraft(draft, catalogs, missingFields, errors);
  }

  if (draft.intent === "conta_a_receber") {
    validateReceivableDraft(draft, catalogs, missingFields, errors);
  }

  if (draft.intent === "banco") {
    validateBankDraft(draft, catalogs, missingFields, errors);
  }

  if (missingFields.length || errors.length) {
    return { ok: false, draft, missingFields, errors };
  }

  return { ok: true, draft, missingFields: [], errors: [] };
}
