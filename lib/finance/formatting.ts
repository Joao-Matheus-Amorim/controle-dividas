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
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
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
