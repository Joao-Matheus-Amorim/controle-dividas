export const mockSupabaseUrl = "https://familyfinance.test";

type MockPermission = {
  profile_id: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  scope: "own" | "selected" | "family";
  allowed_member_ids: string[];
};

export const mockProfiles = [
  { id: "profile-admin", role: "admin", linked_family_member_id: "member-admin" },
  { id: "profile-own", role: "user", linked_family_member_id: "member-own" },
];

export const mockPermissions: MockPermission[] = [
  {
    profile_id: "profile-own",
    module: "GASTOS",
    can_view: true,
    can_create: true,
    can_edit: false,
    can_delete: false,
    scope: "own",
    allowed_member_ids: [],
  },
];

export const mockExpenses = [
  { id: "expense-own", family_member_id: "member-own", description: "Gasto próprio", amount: 10 },
  { id: "expense-other", family_member_id: "member-other", description: "Gasto de outra pessoa", amount: 99 },
  { id: "expense-admin", family_member_id: "member-admin", description: "Gasto admin", amount: 25 },
];

export const mockDashboardTables = {
  family_members: [
    { id: "member-own", name: "Cabele", monthly_limit: 150 },
    { id: "member-other", name: "Outro", monthly_limit: 50 },
  ],
  expenses: [
    { id: "expense-own", family_member_id: "member-own", amount: 10 },
    { id: "expense-other", family_member_id: "member-other", amount: 20 },
  ],
  payable_bills: [{ id: "bill-1", responsible_member_id: "member-own", amount: 40, status: "pendente" }],
  receivable_incomes: [{ id: "income-1", receiver_member_id: "member-own", amount: 100, status: "previsto" }],
  banks: [{ id: "bank-1", family_member_id: "member-own", current_balance: 500 }],
};
