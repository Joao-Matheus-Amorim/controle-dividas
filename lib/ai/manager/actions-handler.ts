"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionContext = {
  profileId: string;
  organizationId: string;
  ownerAuthUserId: string;
  orgSlug: string | null;
  confirmation: string;
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never;
};

export type ActionResult = {
  error?: string;
  success?: string;
  needsConfirmation?: boolean;
  summary?: string;
  details?: Record<string, unknown>;
};

export async function createExpenseFromAi(draft: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const { memberId, categoryId, amount, date, description, bankId, paymentMethod, purchaseLocation, notes } = draft as Record<string, string | undefined>;

  const name = sanitizeInput(description || "");

  const amountNumber = validateAmount(amount);
  if (!amountNumber) {
    const missing = ["memberId", "categoryId", "amount", "date", "description"].filter((f) => !draft[f]);
    return { needsConfirmation: true, summary: `Campos obrigatorios faltando: ${missing.join(", ")}.`, details: {} };
  }

  if (!ctx.confirmation) {
    return {
      needsConfirmation: true,
      summary: `Criar gasto de ${amountNumber.toFixed(2)} em ${description} na data ${date}.`,
      details: { memberId, categoryId, amount: amountNumber, date, description: name, bankId, paymentMethod, purchaseLocation },
    };
  }

  const { error } = await ctx.supabase.from("expenses").insert({
    owner_id: ctx.ownerAuthUserId,
    organization_id: ctx.organizationId,
    family_member_id: memberId,
    category_id: categoryId,
    amount: amountNumber,
    expense_date: date,
    description: name,
    bank_id: bankId || null,
    payment_method: paymentMethod || null,
    purchase_location: purchaseLocation || null,
    notes: notes ? sanitizeInput(notes) : null,
  });

  if (error) return { error: error.message };

  revalidateOrganizationPaths(["/protected/gastos", "/protected"], ctx.orgSlug);
  return { success: "Gasto criado com sucesso." };
}

export async function createPayableBillFromAi(draft: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const { memberId, categoryId, name, amount, dueDate, status, billType, bankId, notes } = draft as Record<string, string | undefined>;

  const billName = sanitizeInput(name || "");

  const amountNumber = validateAmount(amount);
  if (!amountNumber || !dueDate) {
    const missing = ["memberId", "name", "amount", "dueDate"].filter((f) => !draft[f]);
    return { needsConfirmation: true, summary: `Campos obrigatorios faltando: ${missing.join(", ")}.`, details: {} };
  }

  if (!ctx.confirmation) {
    return {
      needsConfirmation: true,
      summary: `Criar conta "${billName}" de ${amountNumber.toFixed(2)} vencimento ${dueDate}.`,
      details: { memberId, categoryId, name: billName, amount: amountNumber, dueDate, status, billType, bankId },
    };
  }

  const { error } = await ctx.supabase.from("payable_bills").insert({
    owner_id: ctx.ownerAuthUserId,
    organization_id: ctx.organizationId,
    responsible_member_id: memberId,
    category_id: categoryId || null,
    name: billName,
    amount: amountNumber,
    due_date: dueDate,
    status: status || "pendente",
    bill_type: billType || "avulsa",
    bank_id: bankId || null,
    notes: notes ? sanitizeInput(notes) : null,
  });

  if (error) return { error: error.message };

  revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected"], ctx.orgSlug);
  return { success: "Conta criada com sucesso." };
}

export async function createReceivableIncomeFromAi(draft: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const { memberId, sourceId, amount, expectedDate, status, incomeType, bankId, paymentOrigin, notes } = draft as Record<string, string | undefined>;

  const amountNumber = validateAmount(amount);
  if (!amountNumber || !expectedDate) {
    const missing = ["memberId", "sourceId", "amount", "expectedDate"].filter((f) => !draft[f]);
    return { needsConfirmation: true, summary: `Campos obrigatorios faltando: ${missing.join(", ")}.`, details: {} };
  }

  if (!ctx.confirmation) {
    return {
      needsConfirmation: true,
      summary: `Criar recebimento de ${amountNumber.toFixed(2)} para ${expectedDate}.`,
      details: { memberId, sourceId, amount: amountNumber, expectedDate, status, incomeType, bankId, paymentOrigin },
    };
  }

  const { error } = await ctx.supabase.from("receivable_incomes").insert({
    owner_id: ctx.ownerAuthUserId,
    organization_id: ctx.organizationId,
    receiver_member_id: memberId,
    source_id: sourceId,
    amount: amountNumber,
    expected_date: expectedDate,
    status: status || "previsto",
    income_type: incomeType || "variavel",
    bank_id: bankId || null,
    payment_origin: paymentOrigin || null,
    notes: notes ? sanitizeInput(notes) : null,
  });

  if (error) return { error: error.message };

  revalidateOrganizationPaths(["/protected/contas-a-receber", "/protected"], ctx.orgSlug);
  return { success: "Recebimento criado com sucesso." };
}

export async function createBankAccountFromAi(draft: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const { memberId, bankName, accountType, currentBalance, currency, notes } = draft as Record<string, string | undefined>;

  const bankNameStr = sanitizeInput(bankName || "");

  const balanceNumber = validateAmount(currentBalance);
  if (!balanceNumber) {
    const missing = ["memberId", "bankName", "accountType"].filter((f) => !draft[f]);
    return { needsConfirmation: true, summary: `Campos obrigatorios faltando: ${missing.join(", ")}.`, details: {} };
  }

  if (!ctx.confirmation) {
    return {
      needsConfirmation: true,
      summary: `Criar conta "${bankNameStr}" (${accountType}) saldo ${balanceNumber.toFixed(2)} ${currency ?? "EUR"}.`,
      details: { memberId, bankName: bankNameStr, accountType, currentBalance: balanceNumber, currency },
    };
  }

  const { error } = await ctx.supabase.from("banks").insert({
    owner_id: ctx.ownerAuthUserId,
    organization_id: ctx.organizationId,
    family_member_id: memberId,
    bank_name: bankNameStr,
    account_type: accountType,
    current_balance: balanceNumber,
    currency: currency || "EUR",
    notes: notes ? sanitizeInput(notes) : null,
  });

  if (error) return { error: error.message };

  revalidateOrganizationPaths(["/protected/bancos", "/protected"], ctx.orgSlug);
  return { success: "Banco criado com sucesso." };
}

export async function deleteExpenseFromAi(id: string, ctx: ActionContext): Promise<ActionResult> {
  if (!id) return { error: "ID do gasto nao informado." };

  if (!ctx.confirmation) {
    const { data } = await ctx.supabase.from("expenses").select("description, amount").eq("id", id).eq("organization_id", ctx.organizationId).maybeSingle();
    return {
      needsConfirmation: true,
      summary: `Excluir gasto "${data?.description ?? id}" de ${Number(data?.amount ?? 0).toFixed(2)}? Esta acao e definitiva.`,
      details: { id },
    };
  }

  const { error, count } = await ctx.supabase.from("expenses").delete({ count: "exact" }).eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  if (count !== 1) return { error: "Gasto nao encontrado." };

  revalidateOrganizationPaths(["/protected/gastos", "/protected"], ctx.orgSlug);
  return { success: "Gasto excluido com sucesso." };
}

export async function deletePayableBillFromAi(id: string, ctx: ActionContext): Promise<ActionResult> {
  if (!id) return { error: "ID da conta nao informado." };

  if (!ctx.confirmation) {
    const { data } = await ctx.supabase.from("payable_bills").select("name, amount").eq("id", id).eq("organization_id", ctx.organizationId).maybeSingle();
    return {
      needsConfirmation: true,
      summary: `Excluir conta "${data?.name ?? id}" de ${Number(data?.amount ?? 0).toFixed(2)}? Esta acao e definitiva.`,
      details: { id },
    };
  }

  const { error, count } = await ctx.supabase.from("payable_bills").delete({ count: "exact" }).eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  if (count !== 1) return { error: "Conta nao encontrada." };

  revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected"], ctx.orgSlug);
  return { success: "Conta excluida com sucesso." };
}

export async function deleteReceivableIncomeFromAi(id: string, ctx: ActionContext): Promise<ActionResult> {
  if (!id) return { error: "ID do recebimento nao informado." };

  if (!ctx.confirmation) {
    const { data } = await ctx.supabase.from("receivable_incomes").select("amount").eq("id", id).eq("organization_id", ctx.organizationId).maybeSingle();
    return {
      needsConfirmation: true,
      summary: `Excluir recebimento de ${Number(data?.amount ?? 0).toFixed(2)}? Esta acao e definitiva.`,
      details: { id },
    };
  }

  const { error, count } = await ctx.supabase.from("receivable_incomes").delete({ count: "exact" }).eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  if (count !== 1) return { error: "Recebimento nao encontrado." };

  revalidateOrganizationPaths(["/protected/contas-a-receber", "/protected"], ctx.orgSlug);
  return { success: "Recebimento excluido com sucesso." };
}

export async function deleteBankAccountFromAi(id: string, ctx: ActionContext): Promise<ActionResult> {
  if (!id) return { error: "ID do banco nao informado." };

  if (!ctx.confirmation) {
    const { data } = await ctx.supabase.from("banks").select("bank_name, currency, current_balance").eq("id", id).eq("organization_id", ctx.organizationId).maybeSingle();
    return {
      needsConfirmation: true,
      summary: `Excluir banco "${data?.bank_name ?? id}" saldo ${Number(data?.current_balance ?? 0).toFixed(2)} ${data?.currency ?? ""}? Esta acao e definitiva.`,
      details: { id },
    };
  }

  const { error, count } = await ctx.supabase.from("banks").delete({ count: "exact" }).eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  if (count !== 1) return { error: "Banco nao encontrado." };

  revalidateOrganizationPaths(["/protected/bancos", "/protected"], ctx.orgSlug);
  return { success: "Banco excluido com sucesso." };
}

export async function markPayablePaidFromAi(billId: string, bankId: string, ctx: ActionContext): Promise<ActionResult> {
  if (!billId || !bankId) {
    return { error: "billId e bankId sao obrigatorios." };
  }

  if (!ctx.confirmation) {
    const { data } = await ctx.supabase.from("payable_bills").select("name, amount").eq("id", billId).eq("organization_id", ctx.organizationId).maybeSingle();
    if (!data) return { error: "Conta nao encontrada." };
    return {
      needsConfirmation: true,
      summary: `Marcar "${sanitizeInput(data.name)}" de ${Number(data.amount).toFixed(2)} como paga?`,
      details: { billId, bankId },
    };
  }

  const recordedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { error } = await ctx.supabase.rpc("mark_payable_bill_paid_with_movement", {
    target_organization_id: ctx.organizationId,
    target_payable_bill_id: billId,
    target_bank_id: bankId,
    target_profile_id: ctx.profileId,
    target_recorded_timezone: recordedTimezone,
  });

  if (error) return { error: error.message };

  revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected/movimentacoes", "/protected"], ctx.orgSlug);
  return { success: "Conta marcada como paga com sucesso." };
}

export async function markReceivableReceivedFromAi(incomeId: string, bankId: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  if (!incomeId) {
    return { error: "incomeId e obrigatorio." };
  }

  if (!ctx.confirmation) {
    const { data } = await ctx.supabase.from("receivable_incomes").select("amount").eq("id", incomeId).eq("organization_id", ctx.organizationId).maybeSingle();
    if (!data) return { error: "Recebimento nao encontrado." };
    return {
      needsConfirmation: true,
      summary: `Marcar recebimento de ${Number(data.amount).toFixed(2)} como recebido?`,
      details: { incomeId, bankId },
    };
  }

  const updateData: Record<string, unknown> = { status: "recebido" };
  if (bankId) updateData.bank_id = bankId;

  const { error } = await ctx.supabase.from("receivable_incomes").update(updateData).eq("id", incomeId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  revalidateOrganizationPaths(["/protected/contas-a-receber", "/protected/movimentacoes", "/protected"], ctx.orgSlug);
  return { success: "Recebimento marcado como recebido com sucesso." };
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function validateAmount(amount: unknown): number | null {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 999999999.99) {
    return null;
  }
  return parsed;
}
