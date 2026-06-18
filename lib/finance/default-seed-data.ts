import { financeCategoryTaxonomy } from "@/lib/finance/category-taxonomy";

export type DefaultFamilyMember = {
  name: string;
  role: string;
  monthlyLimit: number;
  currency: "EUR";
};

export type DefaultExpenseCategory = {
  key: string;
  name: string;
  description?: string;
};

export const defaultFamilyMembers: DefaultFamilyMember[] = [
  // People are intentionally not seeded with sample names. They must be created
  // from the real organization's data to avoid leaking demo/persona content.
];

export const defaultExpenseCategories: DefaultExpenseCategory[] =
  financeCategoryTaxonomy.map(({ key, name, description }) => ({
    key,
    name,
    description,
  }));
