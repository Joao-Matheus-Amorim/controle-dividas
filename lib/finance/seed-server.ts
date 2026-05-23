import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

const duplicateSafeSeedOptions = {
  onConflict: "owner_id,name",
  ignoreDuplicates: true,
} as const;

type SeedUpsertResult = PromiseLike<{ error: { message: string } | null }>;

type SeedSupabaseClient = {
  from(table: "family_members" | "expense_categories"): {
    upsert(rows: unknown[], options: typeof duplicateSafeSeedOptions): SeedUpsertResult;
  };
};

async function assertSeedUpsertSucceeded(upsert: SeedUpsertResult) {
  const { error } = await upsert;

  if (error) {
    throw new Error(error.message);
  }
}

export async function seedInitialFinanceDataForOwner(
  supabase: SeedSupabaseClient,
  ownerId: string,
) {
  await assertSeedUpsertSucceeded(
    supabase
      .from("family_members")
      .upsert(buildDefaultFamilyMemberSeedRows(ownerId), duplicateSafeSeedOptions),
  );

  await assertSeedUpsertSucceeded(
    supabase
      .from("expense_categories")
      .upsert(buildDefaultExpenseCategorySeedRows(ownerId), duplicateSafeSeedOptions),
  );
}
