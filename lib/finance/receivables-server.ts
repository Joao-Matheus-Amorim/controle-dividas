import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import { firstRelation, type MaybeArray } from "@/lib/finance/relations";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";
import { createClient } from "@/lib/supabase/server";

const receivableIncomeSelectFields =
  "id, owner_id, receiver_member_id, source, income_type, amount, expected_date, status, receiving_bank, notes, created_at, family_members(id, name)";

type RawReceivableIncome = Omit<DbReceivableIncome, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
};

type ReceivableProfile = {
  owner_id: string;
};

type ReceivableIncomeQueryBuilder = {
  select(fields: typeof receivableIncomeSelectFields): {
    eq(column: "owner_id", value: string): {
      in(column: "receiver_member_id", values: string[]): {
        order(
          column: "expected_date",
          options: { ascending: true },
        ): {
          order(
            column: "created_at",
            options: { ascending: false },
          ): PromiseLike<{
            data: unknown[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type ReceivableIncomeSupabaseClient = {
  from(table: "receivable_incomes"): ReceivableIncomeQueryBuilder;
};

async function createReceivableIncomeClient(): Promise<ReceivableIncomeSupabaseClient> {
  const supabase = await createClient();
  return supabase as never;
}

function normalizeReceivableIncome(income: RawReceivableIncome): DbReceivableIncome {
  return {
    ...income,
    family_members: firstRelation(income.family_members),
  };
}

export async function getReceivableIncomesFromClient(
  supabase: ReceivableIncomeSupabaseClient,
  profile: ReceivableProfile,
  accessibleMemberIds: string[],
) {
  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("receivable_incomes")
    .select(receivableIncomeSelectFields)
    .eq("owner_id", profile.owner_id)
    .in("receiver_member_id", accessibleMemberIds)
    .order("expected_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawReceivableIncome[]).map(normalizeReceivableIncome);
}

export async function getReceivableIncomesForCurrentProfile() {
  const supabase = await createReceivableIncomeClient();
  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view");

  return getReceivableIncomesFromClient(supabase, profile, accessibleMemberIds);
}
