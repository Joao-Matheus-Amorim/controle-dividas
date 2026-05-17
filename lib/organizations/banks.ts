import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import type { DbBankAccount } from "@/lib/finance/banks-server";
import type { DbFamilyMember } from "@/lib/finance/server";
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

function organizationOrLegacyFilter(organizationId: string) {
  return `organization_id.eq.${organizationId},organization_id.is.null`;
}

export async function getOrganizationBankAccounts() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("BANCOS", "can_view");

  if (accessibleMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("banks")
    .select(
      "id, owner_id, family_member_id, bank_name, account_type, current_balance, currency, notes, created_at, family_members(id, name)",
    )
    .eq("owner_id", profile.owner_id)
    .or(organizationOrLegacyFilter(organization.id))
    .in("family_member_id", accessibleMemberIds)
    .order("bank_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawBankAccount[]).map(normalizeBankAccount);
}

export async function getOrganizationBanksDashboardData() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();
  const accessibleMemberIds = await getAccessibleMemberIds("BANCOS", "can_view");

  const { data: membersData, error: membersError } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", profile.owner_id)
    .eq("is_active", true)
    .or(organizationOrLegacyFilter(organization.id))
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const allMembers = (membersData ?? []) as DbFamilyMember[];
  const accounts = await getOrganizationBankAccounts();
  const members = allMembers.filter((member) => accessibleMemberIds.includes(member.id));

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
