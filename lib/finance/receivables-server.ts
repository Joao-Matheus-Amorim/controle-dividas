import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import { firstRelation, type MaybeArray } from "@/lib/finance/relations";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

const receivableIncomeSelectFields =
  "id, owner_id, receiver_member_id, source, income_type, amount, expected_date, status, receiving_bank, notes, created_at, family_members(id, name)";

type RawReceivableIncome = Omit<DbReceivableIncome, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
};

type LegacyOrganizationScope = {
  owner_id: string;
  organization_id: string;
};

type ReceivableIncomeQueryBuilder = {
  select(fields: typeof receivableIncomeSelectFields): {
    eq(column: "owner_id", value: string): {
      eq(column: "organization_id", value: string): {
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
  scope: LegacyOrganizationScope,
  accessibleMemberIds: string[],
) {
  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("receivable_incomes")
    .select(receivableIncomeSelectFields)
    .eq("owner_id", scope.owner_id)
    .eq("organization_id", scope.organization_id)
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
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view");

  return getReceivableIncomesFromClient(
    supabase,
    { owner_id: organization.owner_auth_user_id, organization_id: organization.id },
    accessibleMemberIds,
  );
}
