"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function checkAuthorizedFamilyEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { allowed: false, error: "Informe o email autorizado pelo Admin." };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("name, role, is_active, auth_user_id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    return { allowed: false, error: error.message };
  }

  if (!data) {
    return { allowed: false, error: "Este email ainda nao foi autorizado pelo Admin familiar." };
  }

  if (!data.is_active) {
    return { allowed: false, error: "Este acesso esta bloqueado. Fale com o Admin familiar." };
  }

  if (data.auth_user_id) {
    return { allowed: false, error: "Este email ja possui acesso ativo. Use a tela de entrada." };
  }

  return { allowed: true, name: data.name, role: data.role };
}
