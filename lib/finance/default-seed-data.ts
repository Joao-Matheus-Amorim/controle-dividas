export type DefaultFamilyMember = {
  name: string;
  role: string;
  monthlyLimit: number;
  currency: "EUR";
};

export type DefaultExpenseCategory = {
  name: string;
};

export const defaultFamilyMembers: DefaultFamilyMember[] = [
  { name: "Danyel", role: "Responsável", monthlyLimit: 150, currency: "EUR" },
  { name: "Pai", role: "Membro", monthlyLimit: 150, currency: "EUR" },
  { name: "Mãe", role: "Membro", monthlyLimit: 150, currency: "EUR" },
  { name: "Gabryel", role: "Filho", monthlyLimit: 50, currency: "EUR" },
  { name: "Caleb", role: "Filho", monthlyLimit: 20, currency: "EUR" },
];

export const defaultExpenseCategories: DefaultExpenseCategory[] = [
  { name: "Alimentação" },
  { name: "Transporte / Passagem" },
  { name: "Mercado" },
  { name: "Escola" },
  { name: "Lazer" },
  { name: "Saúde" },
  { name: "Judô" },
  { name: "Natação" },
  { name: "Luta" },
  { name: "Roupas" },
  { name: "Casa" },
  { name: "Outros" },
];
