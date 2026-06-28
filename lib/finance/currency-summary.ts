import "server-only";

import { compactCurrencyForCode } from "@/lib/finance/formatting";
import { convertCurrencyAmount } from "@/lib/finance/exchange-rates";

export type MoneyAmount = {
  amount: number;
  currency: string;
};

export function groupAmountsByCurrency(amounts: MoneyAmount[]) {
  const totals = new Map<string, number>();

  amounts.forEach(({ amount, currency }) => {
    const normalizedCurrency = String(currency ?? "EUR").trim().toUpperCase() || "EUR";
    const current = totals.get(normalizedCurrency) ?? 0;
    totals.set(normalizedCurrency, current + Number(amount));
  });

  return Array.from(totals.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function formatGroupedCurrencyTotals(amounts: MoneyAmount[]) {
  const groups = groupAmountsByCurrency(amounts);

  if (groups.length === 0) {
    return compactCurrencyForCode(0, "EUR");
  }

  return groups
    .map(({ currency, total }) => compactCurrencyForCode(total, currency))
    .join(" + ");
}

export async function summarizeAmountsInCurrency(
  amounts: MoneyAmount[],
  targetCurrency: string,
) {
  let total = 0;
  let convertedCount = 0;
  const failedCurrencies = new Set<string>();

  for (const entry of amounts) {
    const converted = await convertCurrencyAmount(
      Number(entry.amount),
      entry.currency,
      targetCurrency,
    );

    if (converted === null) {
      failedCurrencies.add(String(entry.currency ?? "EUR").trim().toUpperCase() || "EUR");
      continue;
    }

    total += converted;
    convertedCount += 1;
  }

  return {
    total,
    convertedCount,
    failedCurrencies: Array.from(failedCurrencies).sort(),
    complete: convertedCount === amounts.length,
  };
}
