export type DbFamilyMember = {
  id: string;
  owner_id: string;
  name: string;
  role: string | null;
  monthly_limit: number;
  currency: string;
  is_active: boolean;
  created_at: string;
};

export type DbExpenseCategory = {
  id: string;
  owner_id: string;
  parent_category_id: string | null;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
};

export type DbReceivableIncomeSource = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
};

export type DbExpense = {
  id: string;
  owner_id: string;
  family_member_id: string;
  category_id: string | null;
  expense_date: string;
  description: string;
  purchase_location: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  bank_or_card: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name" | "monthly_limit"> | null;
  expense_categories: Pick<DbExpenseCategory, "id" | "name"> | null;
};

export type ReversedMovementSummary = {
  id: string;
  reversed_at: string;
  bank_name: string | null;
};

export type PayableBillType = "avulsa" | "fixa";

export type DbPayableBill = {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  amount: number;
  currency: string;
  due_date: string;
  responsible_member_id: string | null;
  status: "pago" | "pendente" | "atrasado";
  bill_type: PayableBillType;
  payment_form: string | null;
  bank_used: string | null;
  recurrence: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
  last_reversed_movement?: ReversedMovementSummary | null;
};

export type DbReceivableIncome = {
  id: string;
  owner_id: string;
  receiver_member_id: string | null;
  source: string | null;
  category?: string | null;
  payment_origin: string | null;
  income_type: "fixa" | "variavel";
  amount: number;
  currency: string;
  expected_date: string;
  status: "previsto" | "recebido" | "atrasado";
  payment_form: string | null;
  receiving_bank: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
  last_reversed_movement?: ReversedMovementSummary | null;
};

export type DbBankAccount = {
  id: string;
  owner_id: string;
  family_member_id: string | null;
  bank_name: string;
  account_type: string | null;
  current_balance: number;
  currency: string;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
};

export type FinancialMovementType = "payable_bill_payment" | "receivable_income_receipt" | "expense_payment";

export type FinancialMovementDirection = "inflow" | "outflow";

export type DbFinancialMovement = {
  id: string;
  owner_id: string;
  organization_id: string;
  family_member_id: string;
  bank_id: string;
  movement_type: FinancialMovementType;
  direction: FinancialMovementDirection;
  amount: number;
  currency: string;
  occurred_at: string;
  recorded_timezone: string | null;
  payable_bill_id: string | null;
  receivable_income_id: string | null;
  expense_id: string | null;
  created_by_profile_id: string | null;
  notes: string | null;
  reversed_at: string | null;
  reversed_by_profile_id: string | null;
  reversal_reason: string | null;
  created_at: string;
  updated_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
  banks: Pick<DbBankAccount, "id" | "bank_name" | "account_type" | "currency"> | null;
  payable_bills: Pick<DbPayableBill, "id" | "name" | "bill_type" | "status"> | null;
  receivable_incomes: Pick<DbReceivableIncome, "id" | "source" | "income_type" | "status"> | null;
  expenses: Pick<DbExpense, "id" | "description" | "payment_method"> | null;
};

export type FamilyMemberFormState = {
  error?: string;
  success?: string;
};

export type ExpenseFormState = {
  error?: string;
  success?: string;
};

export type PayableBillFormState = {
  error?: string;
  success?: string;
};

export type ReceivableIncomeFormState = {
  error?: string;
  success?: string;
};

export type BankAccountFormState = {
  error?: string;
  success?: string;
};
