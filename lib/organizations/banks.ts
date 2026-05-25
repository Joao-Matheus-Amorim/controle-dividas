import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type MaybeArray<T> = T | T[] | null;

type RawBankAccount = Omit<DbBankAccount, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
};

function firstRelation<T>(relation: MaybeArray<T>): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function normalizeBankAccount(account: RawBankAccount): DbBankAccount {
  return {
    ...account,
    family_members: firstRelation(account.family_members),
  };
}

async function getOrganizationAccessibleMembers() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("BANCOS", "can_view");

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("id", accessibleMemberIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

export async function getOrganizationBankAccounts() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();
  const members = await getOrganizationAccessibleMembers();
  const scopedMemberIds = members.map((member) => member.id);

  if (scopedMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("banks")
    .select(
      "id, owner_id, family_member_id, bank_name, account_type, current_balance, currency, notes, created_at, family_members(id, name)",
    )
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("family_member_id", scopedMemberIds)
    .order("bank_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawBankAccount[]).map(normalizeBankAccount);
}

export async function getOrganizationBanksDashboardData() {
  const [members, accounts] = await Promise.all([
    getOrganizationAccessibleMembers(),
    getOrganizationBankAccounts(),
  ]);

  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.current_balance),
    0,
  );

  const accountsByMember = members.map((member) => {
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
    members,
    accounts,
    accountsByMember,
    totalBalance,
    totalAccounts: accounts.length,
  };
}
