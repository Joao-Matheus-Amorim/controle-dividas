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
type SeedSelectResult = PromiseLike<{
  count: number | null;
  error: { message: string } | null;
}>;

type SeedSupabaseClient = {
  from(table: "family_members"): {
    upsert(rows: unknown[], options: typeof duplicateSafeSeedOptions): SeedUpsertResult;
  };
  from(table: "expense_categories"): {
    insert(rows: unknown[]): PromiseLike<{ error: SeedInsertError | null }>;
    select(
      columns: string,
      options: { count: "exact"; head: true },
    ): {
      eq(column: "organization_id", value: string): SeedSelectResult;
    };
  };
};

async function assertSeedUpsertSucceeded(upsert: SeedUpsertResult) {
  const { error } = await upsert;

  if (error) {
    throw new Error(error.message);
  }
}

async function organizationAlreadyHasExpenseCategories(
  supabase: SeedSupabaseClient,
  organizationId: string,
) {
  const { count, error } = await supabase
    .from("expense_categories")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return Number(count ?? 0) > 0;
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
    const shouldSeedCategories = !(await organizationAlreadyHasExpenseCategories(
      seedClient,
      organizationId,
    ));

    if (shouldSeedCategories) {
      const { error } = await seedClient.from("expense_categories").insert(categoryRows);

      if (error) {
        const categoriesWereSeededConcurrently = await organizationAlreadyHasExpenseCategories(
          seedClient,
          organizationId,
        );

        if (error.code === "23505" && categoriesWereSeededConcurrently) {
          return;
        }

        throw new Error(error.message);
      }
    }
  }
}
