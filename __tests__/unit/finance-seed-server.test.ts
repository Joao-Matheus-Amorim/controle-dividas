import { describe, expect, it, vi } from "vitest";

import { seedInitialFinanceDataForOwner } from "@/lib/finance/seed-server";
import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

type SeedMockError = { code?: string; message: string };

function createSeedClient(
  results: Partial<
    Record<"family_members" | "expense_categories", { error: SeedMockError | null }>
  > = {},
  existingRootCategoryNames: string[] | string[][] = [],
) {
  const upsertCalls: Array<{ table: string; rows: unknown[]; options: unknown }> = [];
  const insertCalls: Array<{ table: string; rows: unknown[] }> = [];
  const rootCategoryNames = Array.isArray(existingRootCategoryNames)
    && existingRootCategoryNames.every((item) => typeof item === "string")
      ? [existingRootCategoryNames]
      : Array.isArray(existingRootCategoryNames)
        ? [...(existingRootCategoryNames as string[][])]
        : [[]];
  const nextRootCategoryNames = () => rootCategoryNames.shift() ?? rootCategoryNames[rootCategoryNames.length - 1] ?? [];
  const from = vi.fn((table: "family_members" | "expense_categories") => ({
    upsert: vi.fn(async (rows: unknown[], options: unknown) => {
      upsertCalls.push({ table, rows, options });
      return results[table] ?? { error: null };
    }),
    insert: vi.fn(async (rows: unknown[]) => {
      insertCalls.push({ table, rows });
      return results[table] ?? { error: null };
    }),
    select: vi.fn((columns: string) => {
      if (columns === "name,parent_category_id") {
        return {
          eq: vi.fn(() => ({
            is: vi.fn(async () => ({
              data: nextRootCategoryNames().map((name) => ({
                name,
                parent_category_id: null,
              })),
              error: null,
            })),
          })),
        };
      }

      throw new Error(`Unexpected select signature: ${columns}`);
    }),
  }));

  return { client: { from }, from, upsertCalls, insertCalls };
}

describe("finance seed server", () => {
  it("seeds default root categories when the organization has no categories yet", async () => {
    const ownerId = "owner-123";
    const organizationId = "org-123";
    const { client, from, upsertCalls, insertCalls } = createSeedClient();

    await seedInitialFinanceDataForOwner(client, ownerId, organizationId);

    expect(buildDefaultFamilyMemberSeedRows(ownerId, organizationId)).toEqual([]);
    expect(buildDefaultExpenseCategorySeedRows(ownerId, organizationId)).toHaveLength(20);
    expect(from).toHaveBeenCalledWith("expense_categories");
    expect(upsertCalls).toEqual([]);
    expect(insertCalls).toEqual([
      {
        table: "expense_categories",
        rows: buildDefaultExpenseCategorySeedRows(ownerId, organizationId),
      },
    ]);
  });

  it("completes missing default categories when the organization already has a partial root set", async () => {
    const ownerId = "owner-123";
    const organizationId = "org-123";
    const allRows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);
    const existingName = allRows[0]?.name ?? "Receitas";
    const { client, insertCalls } = createSeedClient({}, [existingName]);

    await expect(seedInitialFinanceDataForOwner(client, ownerId, organizationId)).resolves.toBeUndefined();

    expect(insertCalls).toEqual([
      {
        table: "expense_categories",
        rows: allRows.slice(1),
      },
    ]);
  });

  it("tolerates concurrent initial category seeding when another request wins the insert race", async () => {
    const defaultNames = buildDefaultExpenseCategorySeedRows("owner-123", "org-123").map((row) => row.name);
    const { client, insertCalls } = createSeedClient({
      expense_categories: { error: { code: "23505", message: "duplicate key value violates unique constraint" } },
    }, [[], defaultNames]);

    await expect(seedInitialFinanceDataForOwner(client, "owner-123", "org-123")).resolves.toBeUndefined();

    expect(insertCalls).toHaveLength(1);
  });

  it("inserts only missing root categories when the organization is partially seeded", async () => {
    const ownerId = "owner-123";
    const organizationId = "org-123";
    const allRows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);
    const existingNames = allRows.slice(0, 3).map((row) => row.name);
    const { client, insertCalls } = createSeedClient({}, existingNames);

    await expect(seedInitialFinanceDataForOwner(client, ownerId, organizationId)).resolves.toBeUndefined();

    expect(insertCalls).toEqual([
      {
        table: "expense_categories",
        rows: allRows.slice(3),
      },
    ]);
  });
});
