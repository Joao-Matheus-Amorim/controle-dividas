import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

const duplicateSafeSeedOptions = {
  onConflict: "owner_id,name",
  ignoreDuplicates: true,
} as const;

type SeedSupabaseClient = {
  from(table: "family_members" | "expense_categories"): {
    upsert(rows: unknown[], options: typeof duplicateSafeSeedOptions): Promise<unknown>;
  };
};

export async function seedInitialFinanceDataForOwner(
  supabase: SeedSupabaseClient,
  ownerId: string,
) {
  await supabase
    .from("family_members")
    .upsert(buildDefaultFamilyMemberSeedRows(ownerId), duplicateSafeSeedOptions);

  await supabase
    .from("expense_categories")
    .upsert(buildDefaultExpenseCategorySeedRows(ownerId), duplicateSafeSeedOptions);
}
