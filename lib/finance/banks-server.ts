import { getAccessibleMemberIds } from "@/lib/finance/access-control";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";
import { seedInitialFinanceData } from "./server";

export type { BankAccountFormState, DbBankAccount } from "@/lib/finance/types";

type RawBankAccount = Omit<DbBankAccount, "family_members"> & {
  family_members: Pick<DbFamilyMember, "id" | "name"> | Pick<DbFamilyMember, "id" | "name">[] | null;
};

type LegacyOrganizationScope = {
  owner_id: string;
  organization_id: string;
};

type ActiveFamilyMemberQueryBuilder = {
  select(fields: "id, owner_id, name, role, monthly_limit, currency, is_active, created_at"): {
    eq(column: "owner_id", value: string): {
      eq(column: "organization_id", value: string): {
        eq(column: "is_active", value: true): {
          order(column: "created_at", options: { ascending: true }): PromiseLike<{
            data: unknown[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type BankAccountQueryBuilder = {
  select(
    fields: "id, owner_id, family_member_id, bank_name, account_type, current_balance, currency, notes, created_at, family_members(id, name)",
  ): {
    eq(column: "owner_id", value: string): {
      eq(column: "organization_id", value: string): {
        in(column: "family_member_id", values: string[]): {
          order(
            column: "bank_name",
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

type BankSupabaseClient = {
  from(table: "family_members"): ActiveFamilyMemberQueryBuilder;
  from(table: "banks"): BankAccountQueryBuilder;
};

function normalizeBankAccount(account: RawBankAccount): DbBankAccount {
  const familyMember = Array.isArray(account.family_members)
    ? account.family_members[0] ?? null
    : account.family_members;

  return {
    ...account,
    family_members: familyMember,
  };
}

export async function getActiveFamilyMembersByOwnerFromClient(
  supabase: BankSupabaseClient,
  scope: LegacyOrganizationScope,
) {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", scope.owner_id)
    .eq("organization_id", scope.organization_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

export async function getBankAccountsFromClient(
  supabase: BankSupabaseClient,
  scope: LegacyOrganizationScope,
  accessibleMemberIds: string[],
) {
  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("banks")
    .select(
      "id, owner_id, family_member_id, bank_name, account_type, current_balance, currency, notes, created_at, family_members(id, name)",
    )
    .eq("owner_id", scope.owner_id)
    .eq("organization_id", scope.organization_id)
    .in("family_member_id", accessibleMemberIds)
    .order("bank_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawBankAccount[]).map(normalizeBankAccount);
}

export async function getBankAccounts() {
  await seedInitialFinanceData();

  const supabase = (await createClient()) as never as BankSupabaseClient;
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("BANCOS", "can_view");

  return getBankAccountsFromClient(
    supabase,
    { owner_id: organization.owner_auth_user_id, organization_id: organization.id },
    accessibleMemberIds,
  );
}

export async function getBanksDashboardData() {
  await seedInitialFinanceData();

  const supabase = (await createClient()) as never as BankSupabaseClient;
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("BANCOS", "can_view");
  const scope = { owner_id: organization.owner_auth_user_id, organization_id: organization.id };
  const [members, accounts] = await Promise.all([
    getActiveFamilyMembersByOwnerFromClient(supabase, scope),
    getBankAccountsFromClient(supabase, scope, accessibleMemberIds),
  ]);

  const visibleMembers = members.filter((member) => accessibleMemberIds.includes(member.id));

  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.current_balance),
    0,
  );

  const accountsByMember = visibleMembers.map((member) => {
    const memberAccounts = accounts.filter(
      (account) => account.family_member_id === member.id,
    );

    return {
      ...member,
      accounts: memberAccounts,
      totalBalance: memberAccounts.reduce(
        (total, account) => total + Number(account.current_balance),
        0,
      ),
    };
  });

  return {
    members: visibleMembers,
    accounts,
    accountsByMember,
    totalBalance,
    totalAccounts: accounts.length,
  };
}
