import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type RawBankAccount = Omit<DbBankAccount, "family_members"> & {
  family_members?: never;
};

type BankMemberRelation = Pick<DbFamilyMember, "id" | "name">;

function normalizeBankAccount(
  account: RawBankAccount,
  membersById: Map<string, BankMemberRelation>,
): DbBankAccount {
  return {
    ...account,
    family_members: account.family_member_id
      ? membersById.get(account.family_member_id) ?? null
      : null,
  };
}

async function getOrganizationAccessibleMembers(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const accessibleMemberIds = await getAccessibleMemberIds("BANCOS", "can_view", orgSlug);

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

export async function getOrganizationBankAccounts(orgSlug?: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess(orgSlug);
  const members = await getOrganizationAccessibleMembers(orgSlug);
  const scopedMemberIds = members.map((member) => member.id);

  if (scopedMemberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("banks")
    .select(
      "id, owner_id, family_member_id, bank_name, account_type, current_balance, currency, notes, created_at",
    )
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .in("family_member_id", scopedMemberIds)
    .order("bank_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const membersById = new Map(
    members.map((member) => [member.id, { id: member.id, name: member.name }]),
  );

  return ((data ?? []) as RawBankAccount[]).map((account) =>
    normalizeBankAccount(account, membersById),
  );
}

export async function getOrganizationBanksDashboardData(orgSlug?: string) {
  const [members, accounts] = await Promise.all([
    getOrganizationAccessibleMembers(orgSlug),
    getOrganizationBankAccounts(orgSlug),
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
