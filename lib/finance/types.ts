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
  payment_method: string | null;
  bank_or_card: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name" | "monthly_limit"> | null;
  expense_categories: Pick<DbExpenseCategory, "id" | "name"> | null;
};

export type PayableBillType = "avulsa" | "fixa";

export type DbPayableBill = {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  amount: number;
  due_date: string;
  responsible_member_id: string | null;
  status: "pago" | "pendente" | "atrasado";
  bill_type: PayableBillType;
  bank_used: string | null;
  recurrence: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
};

export type DbReceivableIncome = {
  id: string;
  owner_id: string;
  receiver_member_id: string | null;
  source: string;
  payment_origin: string | null;
  income_type: "fixa" | "variavel";
  amount: number;
  expected_date: string;
  status: "previsto" | "recebido" | "atrasado";
  receiving_bank: string | null;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
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
