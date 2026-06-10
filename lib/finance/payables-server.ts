import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import { firstRelation, type MaybeArray } from "@/lib/finance/relations";
import type { DbFamilyMember, DbPayableBill } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

const payableBillSelectFields =
  "id, owner_id, name, category, amount, due_date, responsible_member_id, status, bill_type, bank_used, recurrence, notes, created_at, family_members(id, name)";

type RawPayableBill = Omit<DbPayableBill, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
};

type LegacyOrganizationScope = {
  owner_id: string;
  organization_id: string;
};

type PayableBillQueryBuilder = {
  select(fields: typeof payableBillSelectFields): {
    eq(column: "owner_id", value: string): {
      eq(column: "organization_id", value: string): {
        in(column: "responsible_member_id", values: string[]): {
          order(
            column: "due_date",
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

type PayableBillSupabaseClient = {
  from(table: "payable_bills"): PayableBillQueryBuilder;
};

async function createPayableBillClient(): Promise<PayableBillSupabaseClient> {
  const supabase = await createClient();
  return supabase as never;
}

function normalizePayableBill(bill: RawPayableBill): DbPayableBill {
  return {
    ...bill,
    bill_type: bill.bill_type ?? "avulsa",
    family_members: firstRelation(bill.family_members),
  };
}

export async function getPayableBillsFromClient(
  supabase: PayableBillSupabaseClient,
  scope: LegacyOrganizationScope,
  accessibleMemberIds: string[],
) {
  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("payable_bills")
    .select(payableBillSelectFields)
    .eq("owner_id", scope.owner_id)
    .eq("organization_id", scope.organization_id)
    .in("responsible_member_id", accessibleMemberIds)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawPayableBill[]).map(normalizePayableBill);
}

export async function getPayableBillsForCurrentProfile() {
  const supabase = await createPayableBillClient();
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view");

  return getPayableBillsFromClient(
    supabase,
    { owner_id: organization.owner_auth_user_id, organization_id: organization.id },
    accessibleMemberIds,
  );
}
