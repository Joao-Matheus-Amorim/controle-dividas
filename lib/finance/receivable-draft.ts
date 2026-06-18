import { buildExpenseDraftSuggestion } from "@/lib/finance/expense-draft";
import {
  cleanFinanceDraftText,
  financeDraftReviewNote,
  findFinanceDraftBankByName,
  normalizeFinanceDraftText,
} from "@/lib/finance/finance-draft-utils";
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

function parseReceivableStatus(text: string): ReceivableIncomeDraftSuggestion["status"] {
  const normalizedText = normalizeFinanceDraftText(text);

  if (/\b(?:recebi|recebido|recebida|caiu)\b/.test(normalizedText)) {
    return "recebido";
  }

  if (/\b(?:atrasado|atrasada|venceu)\b/.test(normalizedText)) {
    return "atrasado";
  }

  return "previsto";
}

function parseIncomeType(text: string): ReceivableIncomeDraftSuggestion["incomeType"] {
  const normalizedText = normalizeFinanceDraftText(text);

  return /\b(?:salario|mensal|recorrente|fixa|fixo)\b/.test(normalizedText)
    ? "fixa"
    : "variavel";
}

function findReceivingBankName(text: string, bankAccounts: DbBankAccount[]) {
  const matchingAccount = findFinanceDraftBankByName(text, bankAccounts);

  return matchingAccount?.bank_name ?? (bankAccounts.length === 1 ? bankAccounts[0].bank_name : "");
}

function findSourceName(text: string, sources: DbReceivableIncomeSource[]) {
  const normalizedText = normalizeFinanceDraftText(text);
  const sourceByName = new Map(sources.map((source) => [normalizeFinanceDraftText(source.name), source.name]));

  for (const source of sources) {
    if (normalizedText.includes(normalizeFinanceDraftText(source.name))) {
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
      .map((sourceName) => sourceByName.get(normalizeFinanceDraftText(sourceName)))
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

function parseReceivableAmount(text: string) {
  const amountMatches = Array.from(text.matchAll(/(?:r\$|eur)?\s*(\d{1,6}(?:[.,]\d{1,2})?)/gi))
    .filter((match) => {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const previousChar = text[start - 1] ?? "";
      const nextChar = text[end] ?? "";

      return previousChar !== "/" && previousChar !== "-" && nextChar !== "/" && nextChar !== "-";
    });
  const amountMatch = amountMatches[amountMatches.length - 1];

  return amountMatch?.[1]?.replace(",", ".") ?? "";
}

export function buildReceivableIncomeDraftSuggestion(
  text: string,
  sources: DbReceivableIncomeSource[],
  bankAccounts: DbBankAccount[],
  today: string,
): ReceivableIncomeDraftSuggestion {
  const baseDraft = buildExpenseDraftSuggestion(text, [], bankAccounts, today);
  const cleanText = cleanFinanceDraftText(text);

  return {
    amount: parseReceivableAmount(cleanText),
    expectedDate: baseDraft.expenseDate,
    incomeType: parseIncomeType(cleanText),
    notes: financeDraftReviewNote,
    paymentOrigin: parsePaymentOrigin(cleanText),
    receivingBank: findReceivingBankName(cleanText, bankAccounts),
    source: findSourceName(cleanText, sources),
    status: parseReceivableStatus(cleanText),
  };
}
