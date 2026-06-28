import { type BadgeProps } from "@/components/ui/badge";
import { compactCurrency, compactCurrencyForCode } from "@/lib/finance/formatting";

export { compactCurrency, compactCurrencyForCode };

export function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "recebido") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}
