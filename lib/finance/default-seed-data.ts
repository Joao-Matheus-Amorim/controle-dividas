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
  // People are intentionally not seeded with sample names. They must be created
  // from the real organization's data to avoid leaking demo/persona content.
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
