export type FamilyMember = {
  id: string;
  name: string;
  role: string;
  monthlyLimit: number;
  currency: "EUR";
};

export type ExpenseCategory = {
  id: string;
  name: string;
};

export type Expense = {
  id: string;
  familyMemberId: string;
  categoryId: string;
  date: string;
  description: string;
  location: string;
  amount: number;
  paymentMethod: string;
  bankOrCard: string;
  notes?: string;
};

export type PayableBill = {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  responsibleMemberId: string;
  status: "pago" | "pendente" | "atrasado";
  bank: string;
  recurrence: string;
  notes?: string;
};

export type ReceivableIncome = {
  id: string;
  receiverMemberId: string;
  source: string;
  incomeType: "fixa" | "variavel";
  amount: number;
  expectedDate: string;
  status: "previsto" | "recebido" | "atrasado";
  bank: string;
  notes?: string;
};

export type BankAccount = {
  id: string;
  familyMemberId: string;
  bankName: string;
  accountType: string;
  currentBalance: number;
  currency: "EUR";
  notes?: string;
};

export const familyMembers: FamilyMember[] = [
  { id: "danyel", name: "Danyel", role: "Responsável", monthlyLimit: 150, currency: "EUR" },
  { id: "pai", name: "Pai", role: "Membro", monthlyLimit: 150, currency: "EUR" },
  { id: "mae", name: "Mãe", role: "Membro", monthlyLimit: 150, currency: "EUR" },
  { id: "gabryel", name: "Gabryel", role: "Filho", monthlyLimit: 50, currency: "EUR" },
  { id: "caleb", name: "Caleb", role: "Filho", monthlyLimit: 20, currency: "EUR" },
];

export const expenseCategories: ExpenseCategory[] = [
  { id: "alimentacao", name: "Alimentação" },
  { id: "transporte", name: "Transporte / Passagem" },
  { id: "mercado", name: "Mercado" },
  { id: "escola", name: "Escola" },
  { id: "lazer", name: "Lazer" },
  { id: "saude", name: "Saúde" },
  { id: "judo", name: "Judô" },
  { id: "natacao", name: "Natação" },
  { id: "luta", name: "Luta" },
  { id: "roupas", name: "Roupas" },
  { id: "casa", name: "Casa" },
  { id: "outros", name: "Outros" },
];

export const expenses: Expense[] = [
  { id: "exp-1", familyMemberId: "danyel", categoryId: "alimentacao", date: "2026-05-02", description: "Café", location: "Cafeteria X", amount: 3.5, paymentMethod: "Cartão", bankOrCard: "Revolut" },
  { id: "exp-2", familyMemberId: "pai", categoryId: "transporte", date: "2026-05-03", description: "Passagem semanal", location: "Estação", amount: 18, paymentMethod: "Débito", bankOrCard: "Wise" },
  { id: "exp-3", familyMemberId: "mae", categoryId: "mercado", date: "2026-05-04", description: "Compras da semana", location: "Mercado", amount: 47.9, paymentMethod: "Cartão", bankOrCard: "Millennium" },
  { id: "exp-4", familyMemberId: "gabryel", categoryId: "judo", date: "2026-05-05", description: "Mensalidade do judô", location: "Academia", amount: 22, paymentMethod: "Transferência", bankOrCard: "Revolut" },
  { id: "exp-5", familyMemberId: "caleb", categoryId: "escola", date: "2026-05-06", description: "Material escolar", location: "Papelaria", amount: 8.75, paymentMethod: "Dinheiro", bankOrCard: "Caixa" },
  { id: "exp-6", familyMemberId: "danyel", categoryId: "transporte", date: "2026-05-08", description: "Transporte para trabalho", location: "Metro", amount: 11.4, paymentMethod: "Débito", bankOrCard: "Revolut" },
  { id: "exp-7", familyMemberId: "pai", categoryId: "alimentacao", date: "2026-05-09", description: "Almoço", location: "Restaurante", amount: 12.5, paymentMethod: "Cartão", bankOrCard: "Wise" },
  { id: "exp-8", familyMemberId: "mae", categoryId: "saude", date: "2026-05-10", description: "Farmácia", location: "Farmácia", amount: 15.2, paymentMethod: "Cartão", bankOrCard: "Millennium" },
];

export const payableBills: PayableBill[] = [
  { id: "bill-1", name: "Aluguel", category: "Casa", amount: 680, dueDate: "2026-05-15", responsibleMemberId: "danyel", status: "pendente", bank: "Millennium", recurrence: "mensal" },
  { id: "bill-2", name: "Internet", category: "Casa", amount: 35, dueDate: "2026-05-12", responsibleMemberId: "pai", status: "pendente", bank: "Wise", recurrence: "mensal" },
  { id: "bill-3", name: "Escola", category: "Escola", amount: 120, dueDate: "2026-05-08", responsibleMemberId: "mae", status: "atrasado", bank: "Revolut", recurrence: "mensal" },
  { id: "bill-4", name: "Energia", category: "Casa", amount: 74.3, dueDate: "2026-05-20", responsibleMemberId: "danyel", status: "pendente", bank: "Millennium", recurrence: "mensal" },
];

export const receivableIncomes: ReceivableIncome[] = [
  { id: "inc-1", receiverMemberId: "pai", source: "Salário", incomeType: "fixa", amount: 1450, expectedDate: "2026-05-30", status: "previsto", bank: "Wise" },
  { id: "inc-2", receiverMemberId: "danyel", source: "Empresa / serviços", incomeType: "variavel", amount: 620, expectedDate: "2026-05-18", status: "previsto", bank: "Revolut" },
  { id: "inc-3", receiverMemberId: "gabryel", source: "Mesada / apoio financeiro", incomeType: "fixa", amount: 50, expectedDate: "2026-05-10", status: "recebido", bank: "Caixa" },
];

export const bankAccounts: BankAccount[] = [
  { id: "bank-1", familyMemberId: "danyel", bankName: "Revolut", accountType: "Conta digital", currentBalance: 740, currency: "EUR" },
  { id: "bank-2", familyMemberId: "pai", bankName: "Wise", accountType: "Conta corrente", currentBalance: 1280, currency: "EUR" },
  { id: "bank-3", familyMemberId: "mae", bankName: "Millennium", accountType: "Conta corrente", currentBalance: 960, currency: "EUR" },
  { id: "bank-4", familyMemberId: "gabryel", bankName: "Caixa", accountType: "Poupança", currentBalance: 85, currency: "EUR" },
  { id: "bank-5", familyMemberId: "caleb", bankName: "Caixa", accountType: "Poupança", currentBalance: 35, currency: "EUR" },
];
