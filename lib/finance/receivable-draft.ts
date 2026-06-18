import { buildExpenseDraftSuggestion } from "@/lib/finance/expense-draft";
import type { DbBankAccount, DbReceivableIncomeSource } from "@/lib/finance/types";

export type ReceivableIncomeDraftSuggestion = {
  amount: string;
  expectedDate: string;
  incomeType: "fixa" | "variavel";
  notes: string;
  paymentOrigin: string;
  receivingBank: string;
  source: string;
  status: "previsto" | "recebido" | "atrasado";
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseReceivableStatus(text: string): ReceivableIncomeDraftSuggestion["status"] {
  const normalizedText = normalizeText(text);

  if (/\b(?:recebi|recebido|recebida|caiu)\b/.test(normalizedText)) {
    return "recebido";
  }

  if (/\b(?:atrasado|atrasada|venceu)\b/.test(normalizedText)) {
    return "atrasado";
  }

  return "previsto";
}

function parseIncomeType(text: string): ReceivableIncomeDraftSuggestion["incomeType"] {
  const normalizedText = normalizeText(text);

  return /\b(?:salario|mensal|recorrente|fixa|fixo)\b/.test(normalizedText)
    ? "fixa"
    : "variavel";
}

function findReceivingBankName(text: string, bankAccounts: DbBankAccount[]) {
  const normalizedText = normalizeText(text);
  const matchingAccount = bankAccounts.find((account) => {
    const bankName = normalizeText(account.bank_name);

    return bankName.length >= 2 && normalizedText.includes(bankName);
  });

  return matchingAccount?.bank_name ?? (bankAccounts.length === 1 ? bankAccounts[0].bank_name : "");
}

function findSourceName(text: string, sources: DbReceivableIncomeSource[]) {
  const normalizedText = normalizeText(text);
  const sourceByName = new Map(sources.map((source) => [normalizeText(source.name), source.name]));

  for (const source of sources) {
    if (normalizedText.includes(normalizeText(source.name))) {
      return source.name;
    }
  }

  const sourceAliases: Array<{ aliases: string[]; sourceNames: string[] }> = [
    { aliases: ["salario"], sourceNames: ["Salario", "Salário"] },
    { aliases: ["freelance", "servico", "cliente"], sourceNames: ["Freelance", "Empresa / servicos"] },
    { aliases: ["comissao"], sourceNames: ["Comissao", "Comissão"] },
    { aliases: ["bonus"], sourceNames: ["Bonus", "Bônus"] },
    { aliases: ["venda", "vendas"], sourceNames: ["Vendas"] },
    { aliases: ["reembolso"], sourceNames: ["Reembolsos"] },
    { aliases: ["cashback"], sourceNames: ["Cashback"] },
  ];

  for (const group of sourceAliases) {
    if (!group.aliases.some((alias) => normalizedText.includes(alias))) {
      continue;
    }

    const source = group.sourceNames
      .map((sourceName) => sourceByName.get(normalizeText(sourceName)))
      .find((sourceName): sourceName is string => Boolean(sourceName));

    if (source) {
      return source;
    }
  }

  return "";
}

function parsePaymentOrigin(text: string) {
  const originMatch = text.match(/\b(?:de|do|da)\s+([A-Za-z0-9&.' -]+?)(?=\s+(?:por|no|na|em|amanha|ontem|\d)|$)/i);

  return originMatch?.[1]?.trim() ?? "";
}

export function buildReceivableIncomeDraftSuggestion(
  text: string,
  sources: DbReceivableIncomeSource[],
  bankAccounts: DbBankAccount[],
  today: string,
): ReceivableIncomeDraftSuggestion {
  const baseDraft = buildExpenseDraftSuggestion(text, [], bankAccounts, today);
  const cleanText = text.trim().replace(/\s+/g, " ");

  return {
    amount: baseDraft.amount,
    expectedDate: baseDraft.expenseDate,
    incomeType: parseIncomeType(cleanText),
    notes: "Rascunho assistido; confira antes de cadastrar.",
    paymentOrigin: parsePaymentOrigin(cleanText),
    receivingBank: findReceivingBankName(cleanText, bankAccounts),
    source: findSourceName(cleanText, sources),
    status: parseReceivableStatus(cleanText),
  };
}
