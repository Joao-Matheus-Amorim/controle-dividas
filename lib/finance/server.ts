import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { expenseCategories, familyMembers } from "./mock-data";

export type DbFamilyMember = {
  id: string;
  owner_id: string;
  name: string;
  role: string | null;
  monthly_limit: number;
  currency: string;
  is_active: boolean;
  created_at: string;
};

export type FamilyMemberFormState = {
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

export async function seedInitialFinanceData() {
  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { count } = await supabase
    .from("family_members")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (count && count > 0) {
    return;
  }

  await supabase.from("family_members").insert(
    familyMembers.map((member) => ({
      owner_id: ownerId,
      name: member.name,
      role: member.role,
      monthly_limit: member.monthlyLimit,
      currency: member.currency,
      is_active: true,
    })),
  );

  await supabase.from("expense_categories").insert(
    expenseCategories.map((category) => ({
      owner_id: ownerId,
      name: category.name,
      is_default: true,
    })),
  );
}

export async function getFamilyMembers() {
  await seedInitialFinanceData();

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}
