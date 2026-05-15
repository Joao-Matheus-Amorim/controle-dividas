import { getAccessibleMemberIds, getCurrentProfile } from "@/lib/finance/access-control";
import { createClient } from "@/lib/supabase/server";
import { seedInitialFinanceData, type DbFamilyMember } from "./server";

export type DbBankAccount = {
  id: string;
  owner_id: string;
  family_member_id: string | null;
  bank_name: string;
  account_type: string | null;
  current_balance: number;
  currency: string;
  notes: string | null;
  created_at: string;
  family_members: Pick<DbFamilyMember, "id" | "name"> | null;
};

type RawBankAccount = Omit<DbBankAccount, "family_members"> & {
  family_members: Pick<DbFamilyMember, "id" | "name"> | Pick<DbFamilyMember, "id" | "name">[] | null;
};

export type BankAccountFormState = {
  error?: string;
  success?: string;
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

async function getActiveFamilyMembersByOwner(ownerId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", ownerId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

export async function getBankAccounts() {
  await seedInitialFinanceData();

  const supabase = await createClient();
  const profile = await getCurrentProfile();
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
    .in("family_member_id", accessibleMemberIds)
    .order("bank_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawBankAccount[]).map(normalizeBankAccount);
}

export async function getBanksDashboardData() {
  await seedInitialFinanceData();

  const profile = await getCurrentProfile();
  const accessibleMemberIds = await getAccessibleMemberIds("BANCOS", "can_view");
  const [members, accounts] = await Promise.all([
    getActiveFamilyMembersByOwner(profile.owner_id),
    getBankAccounts(),
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
