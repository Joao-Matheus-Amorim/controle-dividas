import { compactCurrency } from "@/lib/finance/formatting";
import type { DbFinancialMovement } from "@/lib/finance/types";

export { compactCurrency };

export function movementTitle(movement: DbFinancialMovement) {
  if (movement.movement_type === "payable_bill_payment") {
    return movement.payable_bills?.name ?? "Pagamento de conta";
  }

  if (movement.movement_type === "expense_payment") {
    return movement.expenses?.description ?? "Gasto";
  }

  return movement.receivable_incomes?.source ?? "Recebimento";
}

export function movementTypeLabel(movement: DbFinancialMovement) {
  if (movement.movement_type === "payable_bill_payment") {
    return "Conta a pagar";
  }

  if (movement.movement_type === "expense_payment") {
    return "Gasto";
  }

  return "Conta a receber";
}

export function movementAmount(movement: DbFinancialMovement) {
  const amount = compactCurrency(Number(movement.amount));
  return movement.direction === "outflow" ? `-${amount}` : `+${amount}`;
}

export function movementDateTime(movement: DbFinancialMovement) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(movement.occurred_at));
}
