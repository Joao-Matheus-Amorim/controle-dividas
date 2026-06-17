import { isSystemCurrencyOption } from "@/lib/finance/bank-options";

export const currencyFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function compactCurrency(value: number) {
  return formatCurrency(value).replace(/\s+/g, " ").trim();
}

export function compactCurrencyForCode(value: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (!isSystemCurrencyOption(normalizedCurrency)) {
    const formattedAmount = new Intl.NumberFormat("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace(/\s+/g, " ")
      .trim();

    return normalizedCurrency
      ? `${currency.trim()} ${formattedAmount}`.replace(/\s+/g, " ").trim()
      : formattedAmount;
  }

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: normalizedCurrency,
  })
    .format(value)
    .replace(/\s+/g, " ")
    .trim();
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}
