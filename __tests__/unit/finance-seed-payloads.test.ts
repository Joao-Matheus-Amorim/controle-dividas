import { describe, expect, it } from "vitest";

import { financeCategoryTaxonomy, isTransferCategoryName } from "@/lib/finance/category-taxonomy";
import {
  defaultExpenseCategories,
  defaultFamilyMembers,
} from "@/lib/finance/default-seed-data";
import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

describe("finance seed payload builders", () => {
  const ownerId = "owner-123";
  const organizationId = "org-123";

  it("builds organization-scoped duplicate-safe default family member seed rows", () => {
    const rows = buildDefaultFamilyMemberSeedRows(ownerId, organizationId);

    expect(rows).toHaveLength(defaultFamilyMembers.length);
    expect(rows).toEqual(
      defaultFamilyMembers.map((member) => ({
        owner_id: ownerId,
        organization_id: organizationId,
        name: member.name,
        role: member.role,
        monthly_limit: member.monthlyLimit,
        currency: member.currency,
        is_active: true,
      })),
    );
  });

  it("builds the default root expense category taxonomy for AI classification", () => {
    const rows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);

    expect(defaultExpenseCategories).toHaveLength(20);
    expect(defaultExpenseCategories).toEqual(
      financeCategoryTaxonomy.map(({ key, name, description }) => ({
        key,
        name,
        description,
      })),
    );
    expect(defaultExpenseCategories.map((category) => category.name)).toEqual([
      "Receitas",
      "Moradia",
      "Utilidades",
      "Alimentação",
      "Alimentação Fora",
      "Transporte",
      "Saúde",
      "Educação",
      "Filhos",
      "Trabalho",
      "Marketing",
      "Roupas e Acessórios",
      "Lazer e Entretenimento",
      "Viagens",
      "Igreja e Doações",
      "Investimentos",
      "Negócios",
      "Documentação e Taxas",
      "Transferências",
      "Dívidas e Financiamentos",
    ]);
    expect(rows).toEqual(
      defaultExpenseCategories.map((category) => ({
        owner_id: ownerId,
        organization_id: organizationId,
        name: category.name,
        description: category.description ?? null,
        parent_category_id: null,
        is_default: false,
      })),
    );
    expect(rows.every((row) => row.parent_category_id === null)).toBe(true);
    expect(rows.find((row) => row.name === "Transferências")?.description).toContain(
      "não entra no relatório de gastos",
    );
    expect(isTransferCategoryName("Transferencias")).toBe(true);
  });

  it("uses the provided owner id for every seed row", () => {
    const memberRows = buildDefaultFamilyMemberSeedRows(ownerId, organizationId);
    const categoryRows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);

    expect(memberRows.every((row) => row.owner_id === ownerId)).toBe(true);
    expect(categoryRows.every((row) => row.owner_id === ownerId)).toBe(true);
  });

  it("uses the provided organization id for every seed row", () => {
    const memberRows = buildDefaultFamilyMemberSeedRows(ownerId, organizationId);
    const categoryRows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);

    expect(memberRows.every((row) => row.organization_id === organizationId)).toBe(true);
    expect(categoryRows.every((row) => row.organization_id === organizationId)).toBe(true);
  });
});
