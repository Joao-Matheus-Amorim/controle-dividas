import { systemBankOptions, systemCurrencyOptions } from "@/lib/finance/bank-options";

export type BankAccountDraftSuggestion = {
  accountType: string;
  bankName: string;
  currentBalance: string;
  currency: string;
  notes: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseBankName(text: string) {
  const normalizedText = normalizeText(text);

  return systemBankOptions.find((bankName) => {
    const normalizedBankName = normalizeText(bankName);

    return normalizedBankName.length >= 2 && normalizedText.includes(normalizedBankName);
  }) ?? "";
}

function parseAccountType(text: string) {
  const normalizedText = normalizeText(text);

  if (/\b(?:cartao|credito)\b/.test(normalizedText)) return "Cartao de credito";
  if (/\bdebito\b/.test(normalizedText)) return "Cartao de debito";
  if (/\bpoupanca\b/.test(normalizedText)) return "Poupanca";
  if (/\binvest(?:imento|imentos)?\b/.test(normalizedText)) return "Investimentos";
  if (/\bsalario\b/.test(normalizedText)) return "Conta salario";
  if (/\bdigital\b/.test(normalizedText)) return "Conta digital";
  if (/\bdinheiro\b/.test(normalizedText)) return "Dinheiro";
  if (/\bcarteira\b/.test(normalizedText)) return "Carteira digital";

  return /\b(?:conta|corrente)\b/.test(normalizedText) ? "Conta corrente" : "";
}

function parseCurrency(text: string) {
  const normalizedText = normalizeText(text);

  return systemCurrencyOptions.find((currency) => normalizedText.includes(normalizeText(currency))) ?? "EUR";
}

function parseCurrentBalance(text: string) {
  const balanceMatch = text.match(/\b(?:saldo|balance)\s*(?:de|atual|inicial)?\s*(?:r\$|eur|usd|brl|gbp)?\s*(\d{1,9}(?:[.,]\d{1,2})?)/i);

  if (balanceMatch?.[1]) {
    return balanceMatch[1].replace(",", ".");
  }

  const amountMatches = Array.from(text.matchAll(/(?:r\$|eur|usd|brl|gbp)?\s*(\d{1,9}(?:[.,]\d{1,2})?)/gi));
  const amountMatch = amountMatches[amountMatches.length - 1];

  return amountMatch?.[1]?.replace(",", ".") ?? "";
}

export function buildBankAccountDraftSuggestion(text: string): BankAccountDraftSuggestion {
  return {
    accountType: parseAccountType(text),
    bankName: parseBankName(text),
    currentBalance: parseCurrentBalance(text),
    currency: parseCurrency(text),
    notes: "Rascunho assistido; confira antes de cadastrar.",
  };
}
