"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { FamilyMemberFormState } from "@/lib/finance/server";

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

export async function createFamilyMember(
  _prevState: FamilyMemberFormState,
  formData: FormData,
): Promise<FamilyMemberFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const monthlyLimit = Number(formData.get("monthly_limit") ?? 0);

  if (!name) {
    return { error: "Informe o nome da pessoa." };
  }

  if (Number.isNaN(monthlyLimit) || monthlyLimit < 0) {
    return { error: "Informe um limite mensal valido." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { error } = await supabase.from("family_members").insert({
    owner_id: ownerId,
    name,
    role: role || null,
    monthly_limit: monthlyLimit,
    currency: "EUR",
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/pessoas");
  revalidatePath("/protected");

  return { success: "Pessoa cadastrada com sucesso." };
}

export async function toggleFamilyMemberStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "true") === "true";

  if (!id) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("family_members")
    .update({ is_active: !isActive })
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/pessoas");
  revalidatePath("/protected");
}
