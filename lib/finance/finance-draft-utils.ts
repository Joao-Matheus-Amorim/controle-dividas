import type { DbBankAccount } from "@/lib/finance/types";

export const financeDraftReviewNote = "Rascunho assistido; confira antes de cadastrar.";

export function normalizeFinanceDraftText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function cleanFinanceDraftText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseFinanceDraftDate(text: string, today: string) {
  const normalizedText = normalizeFinanceDraftText(text);

  if (normalizedText.includes("ontem")) {
    const date = new Date(`${today}T00:00:00`);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  if (normalizedText.includes("amanha")) {
    const date = new Date(`${today}T00:00:00`);
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  const dateMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (!dateMatch?.[1] || !dateMatch?.[2]) {
    return today;
  }

  const year = dateMatch[3]
    ? dateMatch[3].padStart(4, "20")
    : today.slice(0, 4);
  const month = dateMatch[2].padStart(2, "0");
  const day = dateMatch[1].padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function findFinanceDraftBankByName(text: string, bankAccounts: DbBankAccount[]) {
  const normalizedText = normalizeFinanceDraftText(text);

  return bankAccounts.find((account) => {
    const bankName = normalizeFinanceDraftText(account.bank_name);

    return bankName.length >= 2 && normalizedText.includes(bankName);
  }) ?? null;
}
