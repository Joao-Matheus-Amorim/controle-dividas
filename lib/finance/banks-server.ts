import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveFamilyMembers, seedInitialFinanceData, type DbFamilyMember } from "./server";

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

export type BankAccountFormState = {
  error?: string;
  success?: string;
};

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

export async function getBankAccounts() {
  await seedInitialFinanceData();

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("banks")
    .select(
      "id, owner_id, family_member_id, bank_name, account_type, current_balance, currency, notes, created_at, family_members(id, name)",
    )
    .eq("owner_id", ownerId)
    .order("bank_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbBankAccount[];
}

export async function getBanksDashboardData() {
  const [members, accounts] = await Promise.all([
    getActiveFamilyMembers(),
    getBankAccounts(),
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
