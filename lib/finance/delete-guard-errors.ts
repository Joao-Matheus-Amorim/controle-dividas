type SupabaseDeleteError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export function isFinancialMovementReferenceError(
  error: SupabaseDeleteError | null | undefined,
) {
  if (!error) {
    return false;
  }

  const errorText = [
    error.message,
    error.details,
    error.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return error.code === "23503" && errorText.includes("financial_movements");
}
