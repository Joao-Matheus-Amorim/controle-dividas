import {
  defaultExpenseCategories,
  defaultFamilyMembers,
} from "@/lib/finance/default-seed-data";

export function buildDefaultFamilyMemberSeedRows(
  ownerId: string,
  organizationId: string,
) {
  return defaultFamilyMembers.map((member) => ({
    owner_id: ownerId,
    organization_id: organizationId,
    name: member.name,
    role: member.role,
    monthly_limit: member.monthlyLimit,
    currency: member.currency,
    is_active: true,
  }));
}

export function buildDefaultExpenseCategorySeedRows(
  ownerId: string,
  organizationId: string,
) {
  return defaultExpenseCategories.map((category) => ({
    owner_id: ownerId,
    organization_id: organizationId,
    name: category.name,
    description: category.description ?? null,
    parent_category_id: null,
    is_default: false,
  }));
}
