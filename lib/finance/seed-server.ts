import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

const duplicateSafeSeedOptions = {
  onConflict: "owner_id,name",
  ignoreDuplicates: true,
} as const;

type SeedUpsertResult = PromiseLike<{ error: { message: string } | null }>;
type SeedInsertError = { code?: string; message: string };
type SeedExpenseCategoryRow = {
  name: string;
  parent_category_id: string | null;
};
type SeedSelectCategoriesResult = PromiseLike<{
  data: SeedExpenseCategoryRow[] | null;
  error: { message: string } | null;
}>;

type SeedSupabaseClient = {
  from(table: "family_members"): {
    upsert(rows: unknown[], options: typeof duplicateSafeSeedOptions): SeedUpsertResult;
  };
  from(table: "expense_categories"): {
    insert(rows: unknown[]): PromiseLike<{ error: SeedInsertError | null }>;
    select(columns: "name,parent_category_id"): {
      eq(column: "organization_id", value: string): {
        is(
          column: "parent_category_id",
          value: null,
        ): SeedSelectCategoriesResult;
      };
    };
  };
};

async function assertSeedUpsertSucceeded(upsert: SeedUpsertResult) {
  const { error } = await upsert;

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeSeedCategoryName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

async function getExistingRootCategoryNames(
  supabase: SeedSupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("name,parent_category_id")
    .eq("organization_id", organizationId)
    .is("parent_category_id", null);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => normalizeSeedCategoryName(row.name)));
}

export async function seedInitialFinanceDataForOwner(
  supabase: unknown,
  ownerId: string,
  organizationId: string,
) {
  const seedClient = supabase as SeedSupabaseClient;
  const memberRows = buildDefaultFamilyMemberSeedRows(ownerId, organizationId);
  if (memberRows.length > 0) {
    await assertSeedUpsertSucceeded(
      seedClient
        .from("family_members")
        .upsert(memberRows, duplicateSafeSeedOptions),
    );
  }

  const categoryRows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);
  if (categoryRows.length > 0) {
    const existingRootCategoryNames = await getExistingRootCategoryNames(
      seedClient,
      organizationId,
    );
    const missingCategoryRows = categoryRows.filter(
      (row) => !existingRootCategoryNames.has(normalizeSeedCategoryName(row.name)),
    );

    if (missingCategoryRows.length === 0) {
      return;
    }

    const { error } = await seedClient.from("expense_categories").insert(missingCategoryRows);

    if (error) {
      if (error.code === "23505") {
        const rootCategoryNamesAfterConflict = await getExistingRootCategoryNames(
          seedClient,
          organizationId,
        );
        const missingRowsAfterConflict = categoryRows.filter(
          (row) => !rootCategoryNamesAfterConflict.has(normalizeSeedCategoryName(row.name)),
        );

        if (missingRowsAfterConflict.length === 0) {
          return;
        }
      }

      throw new Error(error.message);
    }
  }
}
