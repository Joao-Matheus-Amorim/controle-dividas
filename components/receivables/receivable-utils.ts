import { type BadgeProps } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/finance/calculations";

export function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "recebido") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}
