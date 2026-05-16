import { formatCurrency } from "@/lib/finance/calculations";

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
