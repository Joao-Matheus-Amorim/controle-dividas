import { compactCurrency } from "@/lib/finance/formatting";
import type { DbFinancialMovement, FinancialMovementType } from "@/lib/finance/types";

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
  return movementTypeLabelFromType(movement.movement_type);
}

export function movementTypeLabelFromType(type: FinancialMovementType) {
  if (type === "payable_bill_payment") {
    return "Conta a pagar";
  }

  if (type === "expense_payment") {
    return "Gasto";
  }

  return "Conta a receber";
}

export function movementAmount(movement: DbFinancialMovement) {
  const amount = compactCurrency(Number(movement.amount));
  return movement.direction === "outflow" ? `-${amount}` : `+${amount}`;
}

export function movementCurrencyLabel(movement: DbFinancialMovement) {
  return movement.currency || movement.banks?.currency || "EUR";
}

export function movementBankLabel(movement: DbFinancialMovement) {
  const bankName = movement.banks?.bank_name ?? "Sem banco";
  const accountType = movement.banks?.account_type;
  const currency = movementCurrencyLabel(movement);

  return accountType ? `${bankName} - ${accountType} - ${currency}` : `${bankName} - ${currency}`;
}

export function movementReferenceLabel(movement: DbFinancialMovement) {
  if (movement.movement_type === "payable_bill_payment") {
    return movement.payable_bills?.bill_type === "fixa" ? "Conta fixa" : "Conta avulsa";
  }

  if (movement.movement_type === "receivable_income_receipt") {
    return movement.receivable_incomes?.income_type === "fixa" ? "Receita fixa" : "Receita variavel";
  }

  return movement.expenses?.payment_method || "Gasto registrado";
}

export function movementDateTime(movement: DbFinancialMovement) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(movement.occurred_at));
}
