import {
  defaultExpenseCategories,
  defaultFamilyMembers,
} from "@/lib/finance/default-seed-data";

export function buildDefaultFamilyMemberSeedRows(ownerId: string) {
  return defaultFamilyMembers.map((member) => ({
    owner_id: ownerId,
    name: member.name,
    role: member.role,
    monthly_limit: member.monthlyLimit,
    currency: member.currency,
    is_active: true,
  }));
}

export function buildDefaultExpenseCategorySeedRows(ownerId: string) {
  return defaultExpenseCategories.map((category) => ({
    owner_id: ownerId,
    name: category.name,
    is_default: true,
  }));
}
