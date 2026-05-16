import { formatCurrency } from "@/lib/finance/calculations";

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
