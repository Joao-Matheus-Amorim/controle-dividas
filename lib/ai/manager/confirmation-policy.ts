export type ConfirmationLevel = "simple" | "preview" | "strong" | "auto_approved" | "blocked";

const CONFIRMATION_MAP: Record<string, ConfirmationLevel> = {
  create_expense: "simple",
  create_payable_bill: "simple",
  create_receivable_income: "simple",
  create_bank_account: "simple",
  create_expense_category: "simple",
  create_receivable_source: "simple",
  update_expense: "preview",
  update_payable_bill: "preview",
  update_receivable_income: "preview",
  update_bank_account: "preview",
  delete_expense: "strong",
  delete_payable_bill: "strong",
  delete_receivable_income: "strong",
  delete_bank_account: "strong",
  delete_expense_category: "strong",
  delete_receivable_source: "strong",
  mark_payable_paid: "strong",
  mark_receivable_received: "strong",
  get_dashboard_summary: "auto_approved",
  get_upcoming_bills: "auto_approved",
  get_category_spending: "auto_approved",
  get_member_limits: "auto_approved",
};

export function getConfirmationLevel(actionType: string): ConfirmationLevel {
  return CONFIRMATION_MAP[actionType] ?? "strong";
}

export function needsConfirmation(actionType: string): boolean {
  const level = getConfirmationLevel(actionType);
  return level !== "auto_approved" && level !== "blocked";
}

export function getConfirmationPrompt(actionType: string, summary: string): string {
  const level = getConfirmationLevel(actionType);

  if (level === "simple") {
    return `Confirma esta acao? ${summary}`;
  }

  if (level === "preview") {
    return `Confirma a alteracao? ${summary}`;
  }

  if (level === "strong") {
    const warnings = {
      delete_expense: "Esta acao e definitiva e nao podera ser desfeita.",
      delete_payable_bill: "Esta acao e definitiva e nao podera ser desfeita.",
      delete_receivable_income: "Esta acao e definitiva e nao podera ser desfeita.",
      delete_bank_account: "Esta acao e definitiva e nao podera ser desfeita.",
      delete_expense_category: "Esta acao e definitiva e nao podera ser desfeita.",
      delete_receivable_source: "Esta acao e definitiva e nao podera ser desfeita.",
      mark_payable_paid: "Marcara a conta como paga, alterando dados financeiros.",
      mark_receivable_received: "Marcara o recebimento como recebido, alterando dados financeiros.",
    };
    const warning = warnings[actionType as keyof typeof warnings] ?? "";
    return `${warning ? "Aviso: " + warning : ""} Esta acao e definitiva. Confirma? ${summary}`;
  }

  return summary;
}
