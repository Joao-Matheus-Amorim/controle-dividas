import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/ai/audit";
import { createAiProvider } from "@/lib/ai/provider";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { getCurrentOrganizationProfile } from "@/lib/finance/access-control";
import { classifyAiFinanceIntent, getAiFinanceClassifierIntentLabel, normalizeInput, type AiFinanceClassifierIntent, type AiFinanceIntentClassification } from "@/lib/finance/ai-finance-intent-classifier";
import { buildAiFinanceUniversalDraft, type AiFinanceUniversalDraftCatalogs } from "@/lib/finance/ai-finance-universal-draft";
import { routeAiCommand, type AiCommandType } from "@/lib/ai/manager/intent-router";
import { getOrganizationExpenseCategories } from "@/lib/organizations/categories";
import { getOrganizationReceivableIncomeSources } from "@/lib/organizations/receivable-income-sources";
import { getOrganizationBankAccountsForMembers } from "@/lib/organizations/banks";
import type { AiFinanceIntent } from "@/lib/finance/ai-finance-intake-schema";
import type { DbBankAccount, DbExpenseCategory, DbFamilyMember, DbReceivableIncomeSource } from "@/lib/finance/types";
import {
  getOrCreateConversation,
  addMessage,
  setConversationIntent,
  updateCollectedData,
  markConversationComplete,
} from "@/lib/ai/conversation";

const chatRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  organization_id: z.string().uuid(),
});

const requiredFieldsByIntent: Record<string, string[]> = {
  gasto: ["memberId", "categoryId", "amount", "date", "description"],
  conta_a_pagar: ["memberId", "categoryId", "name", "amount", "dueDate", "status", "billType"],
  conta_a_receber: ["memberId", "sourceId", "amount", "expectedDate", "status", "incomeType"],
  banco: ["memberId", "bankName", "accountType", "currentBalance", "currency"],
};

const friendlyFieldNames: Record<string, string> = {
  memberId: "membro da familia",
  categoryId: "categoria",
  name: "nome da conta",
  amount: "valor",
  date: "data",
  description: "descricao",
  dueDate: "data de vencimento",
  expectedDate: "data prevista",
  status: "status",
  billType: "tipo de conta (fixa/avulsa)",
  incomeType: "tipo de receita",
  sourceId: "origem",
  bankName: "nome do banco",
  accountType: "tipo de conta",
  currentBalance: "saldo atual",
  currency: "moeda",
};

function getMissingFields(intent: string, data: Record<string, unknown>): string[] {
  const fields = requiredFieldsByIntent[intent];
  if (!fields) return [];
  return fields.filter((f) => {
    const v = data[f];
    return v === undefined || v === null || v === "";
  });
}

function getFriendlyNames(fields: string[]): string[] {
  return fields.map((f) => friendlyFieldNames[f] || f);
}

function formatDateToken(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return String(value ?? "");
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatMoney(value: unknown, currency = "EUR") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value ?? "");
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount);
}

function findMemberName(memberId: unknown, members: DbFamilyMember[]) {
  return typeof memberId === "string"
    ? members.find((member) => member.id === memberId)?.name
    : undefined;
}

function findMemberCurrency(memberId: unknown, members: DbFamilyMember[]) {
  return typeof memberId === "string"
    ? members.find((member) => member.id === memberId)?.currency
    : undefined;
}

function findExpenseCategoryName(categoryId: unknown, categories: DbExpenseCategory[]) {
  return typeof categoryId === "string"
    ? categories.find((category) => category.id === categoryId)?.name
    : undefined;
}

function findReceivableSourceName(sourceId: unknown, sources: DbReceivableIncomeSource[]) {
  return typeof sourceId === "string"
    ? sources.find((source) => source.id === sourceId)?.name
    : undefined;
}

function findBankName(bankId: unknown, bankAccounts: DbBankAccount[]) {
  return typeof bankId === "string"
    ? bankAccounts.find((bank) => bank.id === bankId)?.bank_name
    : undefined;
}

function compactHumanFields(fields: Array<[string, unknown]>) {
  return fields
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `${label}: ${value}`);
}

function buildHumanDraftFields(
  intent: string,
  draftData: Record<string, unknown>,
  catalogs: AiFinanceUniversalDraftCatalogs,
) {
  const members = catalogs.members ?? [];
  const bankAccounts = catalogs.bankAccounts ?? [];
  const currency = findMemberCurrency(draftData.memberId, members) ?? "EUR";

  if (intent === "gasto") {
    return compactHumanFields([
      ["pessoa", findMemberName(draftData.memberId, members)],
      ["categoria", findExpenseCategoryName(draftData.categoryId, catalogs.expenseCategories ?? [])],
      ["valor", draftData.amount ? formatMoney(draftData.amount, currency) : undefined],
      ["data", draftData.date ? formatDateToken(draftData.date) : undefined],
      ["descricao", draftData.description],
      ["local", draftData.purchaseLocation],
      ["pagamento", draftData.paymentMethod],
      ["banco", findBankName(draftData.bankId, bankAccounts)],
    ]);
  }

  if (intent === "conta_a_pagar") {
    return compactHumanFields([
      ["responsavel", findMemberName(draftData.memberId, members)],
      ["categoria", findExpenseCategoryName(draftData.categoryId, catalogs.expenseCategories ?? [])],
      ["conta", draftData.name],
      ["valor", draftData.amount ? formatMoney(draftData.amount, currency) : undefined],
      ["vencimento", draftData.dueDate ? formatDateToken(draftData.dueDate) : undefined],
      ["status", draftData.status],
      ["tipo", draftData.billType],
      ["banco", findBankName(draftData.bankId, bankAccounts)],
    ]);
  }

  if (intent === "conta_a_receber") {
    return compactHumanFields([
      ["recebedor", findMemberName(draftData.memberId, members)],
      ["origem", findReceivableSourceName(draftData.sourceId, catalogs.receivableSources ?? [])],
      ["valor", draftData.amount ? formatMoney(draftData.amount, currency) : undefined],
      ["data prevista", draftData.expectedDate ? formatDateToken(draftData.expectedDate) : undefined],
      ["status", draftData.status],
      ["tipo", draftData.incomeType],
      ["origem do pagamento", draftData.paymentOrigin],
      ["banco", findBankName(draftData.bankId, bankAccounts)],
    ]);
  }

  if (intent === "banco") {
    return compactHumanFields([
      ["pessoa", findMemberName(draftData.memberId, members)],
      ["banco", draftData.bankName],
      ["tipo", draftData.accountType],
      ["saldo", draftData.currentBalance ? formatMoney(draftData.currentBalance, String(draftData.currency ?? "EUR")) : undefined],
      ["moeda", draftData.currency],
    ]);
  }

  return [];
}

function buildHumanDraftMessage({
  intent,
  draftData,
  missingFields,
  draftReady,
  catalogs,
}: {
  intent: AiFinanceClassifierIntent;
  draftData: Record<string, unknown>;
  missingFields: string[];
  draftReady: boolean;
  catalogs: AiFinanceUniversalDraftCatalogs;
}) {
  const intentLabel = getAiFinanceClassifierIntentLabel(intent);
  const filledFields = buildHumanDraftFields(intent, draftData, catalogs);
  const lines = [`Detectei ${intentLabel} e montei um rascunho para voce revisar.`];

  if (filledFields.length > 0) {
    lines.push(`Preenchi: ${filledFields.join("; ")}.`);
  } else {
    lines.push("Ainda nao consegui preencher campos suficientes com seguranca.");
  }

  if (missingFields.length > 0) {
    lines.push(`Ainda falta: ${getFriendlyNames(missingFields).join(", ")}.`);
  }

  lines.push(
    draftReady
      ? "Nada foi salvo ainda. Clique em Revisar rascunho para abrir o formulario, corrigir o que faltar e salvar."
      : "Nada foi salvo ainda. Envie mais detalhes para eu montar um rascunho melhor.",
  );

  return lines.join(" ");
}

function normalizeInputSimple(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestTextMatch<T extends { id: string }>(
  text: string,
  items: T[],
  getName: (item: T) => string,
  minScore = 10,
): T | null {
  const normalized = normalizeInputSimple(text);
  const stopWords = new Set(["marca", "marcar", "como", "pago", "paga", "pague", "a", "o", "de", "da", "do", "para", "e", "em", "no", "na", "por", "com", "se", "voce", "sua", "editar", "edite", "alterar", "altera", "excluir", "exclua", "apagar", "apague", "deletar", "remover", "cancelar"]);
  const textTokens = new Set(normalized.split(/\s+/).filter((t) => t.length > 1 && !stopWords.has(t)));

  let best: T | null = null;
  let bestScore = 0;

  for (const item of items) {
    const itemName = normalizeInputSimple(getName(item));
    let score = 0;

    if (normalized.includes(itemName)) {
      score += 100;
    }

    const itemTokens = itemName.split(/\s+/).filter(Boolean);
    for (const it of itemTokens) {
      if (textTokens.has(it)) {
        score += 10;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore >= minScore ? best : null;
}

function findBestPayableBillMatch(
  text: string,
  bills: Array<{ id: string; name: string; amount: number; due_date: string; responsible_member_id: string | null }>,
) {
  const normalized = normalizeInputSimple(text);
  const stopWords = new Set(["marca", "marcar", "como", "pago", "paga", "pague", "a", "o", "de", "da", "do", "para", "e", "em", "no", "na", "por", "com", "se", "voce", "sua"]);
  const textTokens = new Set(normalized.split(/\s+/).filter((t) => t.length > 1 && !stopWords.has(t)));

  let best: (typeof bills)[0] | null = null;
  let bestScore = 0;

  for (const bill of bills) {
    const billName = normalizeInputSimple(bill.name);
    let score = 0;

    if (normalized.includes(billName)) {
      score += 100;
    }

    const billTokens = billName.split(/\s+/).filter(Boolean);
    for (const bt of billTokens) {
      if (textTokens.has(bt)) {
        score += 10;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = bill;
    }
  }

  return bestScore >= 10 ? best : null;
}

function buildCatalogContext(catalogs?: AiFinanceUniversalDraftCatalogs): string[] {
  const lines: string[] = [];
  if (!catalogs) return lines;

  if (catalogs.members && catalogs.members.length > 0) {
    const names = catalogs.members.map((m) => m.name).join(", ");
    lines.push(`Membros da familia cadastrados: ${names}.`);
  }

  if (catalogs.expenseCategories && catalogs.expenseCategories.length > 0) {
    const names = catalogs.expenseCategories.map((c) => c.name).join(", ");
    lines.push(`Categorias de gasto: ${names}.`);
  }

  if (catalogs.receivableSources && catalogs.receivableSources.length > 0) {
    const names = catalogs.receivableSources.map((s) => s.name).join(", ");
    lines.push(`Origens de receita: ${names}.`);
  }

  if (catalogs.bankAccounts && catalogs.bankAccounts.length > 0) {
    const names = catalogs.bankAccounts
      .map((b) => (b.account_type ? `${b.bank_name} (${b.account_type})` : b.bank_name))
      .join(", ");
    lines.push(`Contas bancarias: ${names}.`);
  }

  return lines;
}

async function handleEditIntent(
  classification: AiFinanceIntentClassification,
  allUserTexts: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  organization_id: string,
  profileId: string,
  members: DbFamilyMember[],
) {
  const intent = classification.intent as AiFinanceIntent;
  const intentLabel = getAiFinanceClassifierIntentLabel(intent);

  if (intent === "gasto") {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, description, amount, expense_date, category_id, family_member_id, bank_id, payment_method, purchase_location, notes")
      .eq("organization_id", organization_id)
      .order("expense_date", { ascending: false })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, expenses ?? [], (e) => e.description);
    if (!matched) {
      const content = `Nao encontrei nenhum gasto com essa descricao. Tente novamente com mais detalhes.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "gasto" as const, description: matched.description, amount: matched.amount, date: matched.expense_date, memberId: matched.family_member_id, categoryId: matched.category_id, bankId: matched.bank_id, paymentMethod: matched.payment_method, purchaseLocation: matched.purchase_location, notes: matched.notes };
    const content = `Encontrei o gasto "${matched.description}" (${formatMoney(matched.amount)}). Vou abrir o formulario para voce editar.`;
    await addMessage(organization_id, profileId, "assistant", content);
    await setConversationIntent(organization_id, profileId, "gasto");
    await updateCollectedData(organization_id, profileId, draft as unknown as Record<string, unknown>);
    return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

  if (intent === "conta_a_pagar") {
    const { data: bills } = await supabase
      .from("payable_bills")
      .select("id, name, amount, due_date, status, bill_type, category_id, responsible_member_id, bank_id, notes")
      .eq("organization_id", organization_id)
      .order("due_date", { ascending: false })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, bills ?? [], (b) => b.name);
    if (!matched) {
      const content = `Nao encontrei nenhuma conta com esse nome. Tente novamente com mais detalhes.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "conta_a_pagar" as const, name: matched.name, amount: matched.amount, dueDate: matched.due_date, status: matched.status, billType: matched.bill_type, memberId: matched.responsible_member_id, categoryId: matched.category_id, bankId: matched.bank_id, notes: matched.notes };
    const content = `Encontrei a conta "${matched.name}" (${formatMoney(matched.amount)}). Vou abrir o formulario para voce editar.`;
    await addMessage(organization_id, profileId, "assistant", content);
    return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

  if (intent === "conta_a_receber") {
    const { data: incomes } = await supabase
      .from("receivable_incomes")
      .select("id, amount, expected_date, status, income_type, source_id, receiver_member_id, bank_id, payment_origin, notes")
      .eq("organization_id", organization_id)
      .order("expected_date", { ascending: false })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, incomes ?? [], (i) => String(i.amount));
    if (!matched) {
      const content = `Nao encontrei nenhum recebimento com essas informacoes. Tente novamente com mais detalhes.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "conta_a_receber" as const, amount: matched.amount, expectedDate: matched.expected_date, status: matched.status, incomeType: matched.income_type, sourceId: matched.source_id, memberId: matched.receiver_member_id, bankId: matched.bank_id, paymentOrigin: matched.payment_origin, notes: matched.notes };
    const content = `Encontrei um recebimento de ${formatMoney(matched.amount)}. Vou abrir o formulario para voce editar.`;
    await addMessage(organization_id, profileId, "assistant", content);
    return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

  if (intent === "banco") {
    const { data: banks } = await supabase
      .from("banks")
      .select("id, bank_name, account_type, current_balance, currency, family_member_id, notes")
      .eq("organization_id", organization_id)
      .order("bank_name", { ascending: true })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, banks ?? [], (b) => b.bank_name);
    if (!matched) {
      const content = `Nao encontrei nenhuma conta bancaria com esse nome. Tente novamente com mais detalhes.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "banco" as const, bankName: matched.bank_name, accountType: matched.account_type, currentBalance: matched.current_balance, currency: matched.currency, memberId: matched.family_member_id, notes: matched.notes };
    const content = `Encontrei a conta "${matched.bank_name}". Vou abrir o formulario para voce editar.`;
    await addMessage(organization_id, profileId, "assistant", content);
    return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

    const content = `Nao consigo editar ${intentLabel} por enquanto.`;
  await addMessage(organization_id, profileId, "assistant", content);
  return NextResponse.json({ result: { content, classification: { intent, actionType: "editar", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
}

async function handleDeleteIntent(
  classification: AiFinanceIntentClassification,
  allUserTexts: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  organization_id: string,
  profileId: string,
) {
  const intent = classification.intent as AiFinanceIntent;
  const intentLabel = getAiFinanceClassifierIntentLabel(intent);

  if (intent === "gasto") {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, description, amount, expense_date")
      .eq("organization_id", organization_id)
      .order("expense_date", { ascending: false })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, expenses ?? [], (e) => e.description);
    if (!matched) {
      const content = `Nao encontrei nenhum gasto com essa descricao. Tente novamente.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "gasto", name: matched.description, amount: matched.amount };
    const content = `Confirma a exclusao do gasto "${matched.description}" (${formatMoney(matched.amount)})? Esta acao nao pode ser desfeita.`;
    await addMessage(organization_id, profileId, "assistant", content);
    await setConversationIntent(organization_id, profileId, "gasto");
    return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

  if (intent === "conta_a_pagar") {
    const { data: bills } = await supabase
      .from("payable_bills")
      .select("id, name, amount, due_date, status")
      .eq("organization_id", organization_id)
      .order("due_date", { ascending: false })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, bills ?? [], (b) => b.name);
    if (!matched) {
      const content = `Nao encontrei nenhuma conta com esse nome. Tente novamente.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "conta_a_pagar", name: matched.name, amount: matched.amount };
    const content = `Confirma a exclusao da conta "${matched.name}" (${formatMoney(matched.amount)})? Esta acao nao pode ser desfeita.`;
    await addMessage(organization_id, profileId, "assistant", content);
    await setConversationIntent(organization_id, profileId, "conta_a_pagar");
    return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

  if (intent === "conta_a_receber") {
    const { data: incomes } = await supabase
      .from("receivable_incomes")
      .select("id, amount, expected_date, status")
      .eq("organization_id", organization_id)
      .order("expected_date", { ascending: false })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, incomes ?? [], (i) => String(i.amount));
    if (!matched) {
      const content = `Nao encontrei nenhum recebimento com essas informacoes. Tente novamente.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "conta_a_receber", name: `${formatMoney(matched.amount)} - ${matched.expected_date}`, amount: matched.amount };
    const content = `Confirma a exclusao do recebimento de ${formatMoney(matched.amount)} (${matched.expected_date})? Esta acao nao pode ser desfeita.`;
    await addMessage(organization_id, profileId, "assistant", content);
    await setConversationIntent(organization_id, profileId, "conta_a_receber");
    return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

  if (intent === "banco") {
    const { data: banks } = await supabase
      .from("banks")
      .select("id, bank_name, account_type, current_balance, currency")
      .eq("organization_id", organization_id)
      .order("bank_name", { ascending: true })
      .limit(50);

    const matched = findBestTextMatch(allUserTexts, banks ?? [], (b) => b.bank_name);
    if (!matched) {
      const content = `Nao encontrei nenhuma conta bancaria com esse nome. Tente novamente.`;
      await addMessage(organization_id, profileId, "assistant", content);
      return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
    }

    const draft = { id: matched.id, intent: "banco", name: matched.bank_name };
    const content = `Confirma a exclusao da conta "${matched.bank_name}"? Esta acao nao pode ser desfeita.`;
    await addMessage(organization_id, profileId, "assistant", content);
    await setConversationIntent(organization_id, profileId, "banco");
    return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: true, draft: draft as unknown as Record<string, unknown> } });
  }

  const content = `Nao consigo excluir ${intentLabel} por enquanto.`;
  await addMessage(organization_id, profileId, "assistant", content);
  return NextResponse.json({ result: { content, classification: { intent, actionType: "excluir", confidence: classification.confidence }, conversationComplete: true, draftReady: false } });
}

async function handleMarkReceivedIntent(
  allUserTexts: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  organization_id: string,
  profileId: string,
  members: DbFamilyMember[],
  bankAccounts: DbBankAccount[],
) {
  const { data: unpaidIncomes } = await supabase
    .from("receivable_incomes")
    .select("id, amount, expected_date, status, income_type, source_id, receiver_member_id, bank_id, payment_origin, notes")
    .eq("organization_id", organization_id)
    .neq("status", "recebido")
    .order("expected_date", { ascending: true });

  const matchedIncome = findBestTextMatch(allUserTexts, unpaidIncomes ?? [], (i) => i.notes ?? `${i.amount}`);
  if (!matchedIncome) {
    const noMatchContent = "Nao encontrei nenhum recebimento pendente com essas informacoes. Tente novamente com mais detalhes.";
    await addMessage(organization_id, profileId, "assistant", noMatchContent);
    return NextResponse.json({
      result: {
        content: noMatchContent,
        classification: { intent: "conta_a_receber", actionType: "receber", confidence: "medium" as const },
        conversationComplete: true,
        draftReady: false,
      },
    });
  }

  const member = members.find((m) => m.id === matchedIncome.receiver_member_id);
  const memberName = member?.name ?? "";
  const memberBankAccounts = bankAccounts.filter(
    (b) => b.family_member_id === matchedIncome.receiver_member_id,
  );

  const draftData: Record<string, unknown> = {
    intent: "conta_a_receber",
    incomeId: matchedIncome.id,
    incomeAmount: matchedIncome.amount,
    incomeDueDate: matchedIncome.expected_date,
    memberName,
    memberBankAccounts: memberBankAccounts.map((b) => ({ id: b.id, name: b.bank_name })),
  };

  const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: member?.currency ?? "EUR" }).format(matchedIncome.amount);
  const actionContent = `Encontrei um recebimento de ${formattedAmount} (${matchedIncome.expected_date})${memberName ? ` de ${memberName}` : ""}. Confirma a marcacao como recebido?`;

  await addMessage(organization_id, profileId, "assistant", actionContent);
  await setConversationIntent(organization_id, profileId, "conta_a_receber");
  await markConversationComplete(organization_id, profileId);

  return NextResponse.json({
    result: {
      content: actionContent,
      classification: { intent: "conta_a_receber", actionType: "receber", confidence: "medium" as const },
      conversationComplete: true,
      draftReady: true,
      draft: draftData,
    },
  });
}

function buildSystemPrompt(
  intent: AiFinanceClassifierIntent,
  collectedData: Record<string, unknown>,
  missingFields: string[],
  isComplete: boolean,
  catalogs?: AiFinanceUniversalDraftCatalogs,
): string {
  const intentLabel = getAiFinanceClassifierIntentLabel(intent);
  const lines: string[] = [
    "Voce e um assistente financeiro do FamilyFinance, um SaaS de controle financeiro pessoal e familiar.",
    "Responda de forma concisa, direta e em portugues brasileiro.",
    "Nao invente dados. Use apenas as informacoes fornecidas pelo usuario.",
    "Nao execute acoes de escrita, criacao, alteracao ou exclusao de dados.",
    "Mantenha o tom profissional e amigavel.",
    "",
    `Intencao do usuario: ${intentLabel}.`,
  ];

  const catalogLines = buildCatalogContext(catalogs);
  lines.push(...catalogLines);

  if (intent === "pergunta") {
    lines.push("O usuario fez uma pergunta financeira. Responda com base no contexto fornecido.");
  } else {
    const collected = Object.entries(collectedData)
      .filter(([k]) => k !== "intent" && requiredFieldsByIntent[intent]?.includes(k))
      .map(([k, v]) => `${friendlyFieldNames[k] || k}: ${v}`);

    if (collected.length > 0) {
      lines.push(`Dados ja coletados: ${collected.join(", ")}.`);
    }

    if (missingFields.length > 0) {
      const friendly = getFriendlyNames(missingFields);
      lines.push(`Campos obrigatorios faltantes: ${friendly.join(", ")}.`);
      lines.push("Pergunte ao usuario sobre esses campos de forma natural, um de cada vez.");
    }

    if (isComplete) {
      lines.push("Todos os campos obrigatorios foram preenchidos.");
      lines.push("Apresente um resumo do registro e pergunte se o usuario quer confirmar ou ajustar algo.");
    }
  }

  return lines.join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError || !auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { text, organization_id } = parsed.data;

    const profile = await getCurrentOrganizationProfile();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Inactive or missing profile" }, { status: 403 });
    }

    if (profile.organization_id !== organization_id) {
      return NextResponse.json({ error: "Invalid organization context" }, { status: 403 });
    }

    const classification = classifyAiFinanceIntent(text);
    const commandRoute = routeAiCommand(text);

    if (commandRoute.type === "refused") {
      await auditLog({
        action: "chat_refusal",
        payload: { text, organization_id },
        result: { reason: commandRoute.reason },
        success: true,
        organization_id,
        created_by: profile.id,
      });

      return NextResponse.json({
        result: {
          content: "Nao posso executar essa acao. O assistente e apenas para consulta e registro de dados financeiros.",
          classification: { intent: classification.intent, actionType: classification.actionType, confidence: classification.confidence },
        },
      });
    }

    const rateLimitKey = profile.id;
    const rateLimitResult = await checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      await auditLog({
        action: "chat_completion",
        payload: { text, organization_id, classification: commandRoute.type },
        result: { error: "rate_limited" },
        success: false,
        organization_id,
        created_by: profile.id,
      });

      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterMs: rateLimitResult.resetInMs },
        { status: 429 },
      );
    }

    let conv = await getOrCreateConversation(organization_id, profile.id);

    if (!conv.intent && commandRoute.type !== "query" && commandRoute.type !== "help") {
      const createIntent = classification.intent as "gasto" | "conta_a_pagar" | "conta_a_receber" | "banco";
      conv = await setConversationIntent(organization_id, profile.id, createIntent);
    }

    conv = await addMessage(organization_id, profile.id, "user", text);

    const today = new Date().toISOString().slice(0, 10);
    const allUserTexts = conv.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(". ");

    const { data: rawMembers } = await supabase
      .from("family_members")
      .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
      .eq("organization_id", organization_id)
      .eq("is_active", true);
    const members = (rawMembers ?? []) as DbFamilyMember[];

    let expenseCategories: DbExpenseCategory[] = [];
    let receivableSources: DbReceivableIncomeSource[] = [];
    let bankAccounts: DbBankAccount[] = [];

    if (commandRoute.type !== "query" && commandRoute.type !== "help") {
      const effectiveIntent = classification.intent;
      [expenseCategories, receivableSources, bankAccounts] = await Promise.all([
        effectiveIntent === "gasto" || effectiveIntent === "conta_a_pagar"
          ? getOrganizationExpenseCategories()
          : Promise.resolve([]),
        effectiveIntent === "conta_a_receber"
          ? getOrganizationReceivableIncomeSources()
          : Promise.resolve([]),
        effectiveIntent !== "banco"
          ? getOrganizationBankAccountsForMembers(members)
          : Promise.resolve([]),
      ]);
    }

    const catalogs: AiFinanceUniversalDraftCatalogs = {
      members,
      expenseCategories,
      receivableSources,
      bankAccounts,
    };

    const isUpdate = commandRoute.type.startsWith("update_");
    const isDelete = commandRoute.type.startsWith("delete_");
    const isPayment = commandRoute.type === "mark_payable_paid" || classification.intent === "acao_pagamento";
    const isReceive = commandRoute.type === "mark_receivable_received";
    const isQuery = commandRoute.type === "query" || classification.intent === "pergunta";
    const isHelp = commandRoute.type === "help";

    if (isPayment) {
      conv = await setConversationIntent(organization_id, profile.id, "acao_pagamento");

      const { data: unpaidBills } = await supabase
        .from("payable_bills")
        .select("id, name, amount, due_date, responsible_member_id")
        .eq("organization_id", organization_id)
        .neq("status", "pago")
        .order("due_date", { ascending: true });

      const matchedBill = findBestPayableBillMatch(allUserTexts, unpaidBills ?? []);

      if (!matchedBill) {
        const noMatchContent = "Nao encontrei nenhuma conta pendente com esse nome. Tente novamente com mais detalhes.";
        await addMessage(organization_id, profile.id, "assistant", noMatchContent);
        await auditLog({
          action: "chat_completion",
          payload: { text, organization_id, classification: "acao_pagamento" },
          result: { content: noMatchContent },
          success: true,
          organization_id,
          created_by: profile.id,
        });
        return NextResponse.json({
          result: {
            content: noMatchContent,
            classification: { intent: "acao_pagamento", actionType: "pagar", confidence: classification.confidence },
            conversationComplete: true,
            draftReady: false,
          },
        });
      }

      const member = members.find((m) => m.id === matchedBill.responsible_member_id);
      const memberName = member?.name ?? "";
      const memberBankAccounts = (bankAccounts ?? []).filter(
        (b) => b.family_member_id === matchedBill.responsible_member_id,
      );

      const draftData: Record<string, unknown> = {
        intent: "acao_pagamento",
        billId: matchedBill.id,
        billName: matchedBill.name,
        billAmount: matchedBill.amount,
        billDueDate: matchedBill.due_date,
        memberName,
        memberBankAccounts: memberBankAccounts.map((b) => ({ id: b.id, name: b.bank_name })),
      };

      conv = await updateCollectedData(organization_id, profile.id, draftData);
      conv = await markConversationComplete(organization_id, profile.id);

      const currency = member?.currency ?? "EUR";
      const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(matchedBill.amount);
      const actionContent = `Encontrei a conta "${matchedBill.name}" (${formattedAmount}) de ${memberName}, vencimento ${matchedBill.due_date}. Confirma a marcacao como paga?`;

      await addMessage(organization_id, profile.id, "assistant", actionContent);
      await auditLog({
        action: "chat_completion",
        payload: { text, organization_id, classification: "acao_pagamento", billId: matchedBill.id },
        result: { content: actionContent },
        success: true,
        organization_id,
        created_by: profile.id,
      });

      return NextResponse.json({
        result: {
          content: actionContent,
          classification: { intent: "acao_pagamento", actionType: "pagar", confidence: classification.confidence },
          conversationComplete: true,
          draftReady: true,
          draft: draftData,
        },
      });
    }

    if (isReceive) {
      return await handleMarkReceivedIntent(allUserTexts, supabase, organization_id, profile.id, members, bankAccounts);
    }

    if (isUpdate || classification.actionType === "editar") {
      return await handleEditIntent(classification, allUserTexts, supabase, organization_id, profile.id, members);
    }

    if (isDelete || classification.actionType === "excluir") {
      return await handleDeleteIntent(classification, allUserTexts, supabase, organization_id, profile.id);
    }

    if (isHelp) {
      const helpContent = "Posso ajudar voce a registrar gastos, contas a pagar, contas a receber, bancos, editar ou excluir registros existentes, e consultar informacoes financeiras. Como posso ajudar?";
      return NextResponse.json({
        result: {
          content: helpContent,
          classification: { intent: "pergunta", actionType: "consultar", confidence: "high" },
          conversationComplete: true,
          draftReady: false,
        },
      });
    }

    let draftData: Record<string, unknown> = {};
    let missingFields: string[] = [];
    let isComplete = false;
    let draftReady = false;

    if (!isQuery) {
      draftData = { ...conv.collectedData };

      const draftResult = buildAiFinanceUniversalDraft({ text: allUserTexts, today, catalogs });
      if (
        draftResult.draft &&
        (draftResult.classification.intent === classification.intent ||
          draftResult.classification.intent === conv.intent)
      ) {
        const draft = draftResult.draft as Record<string, unknown>;
        for (const [key, value] of Object.entries(draft)) {
          if (value !== undefined && value !== null && value !== "" && key !== "intent") {
            draftData[key] = value;
          }
        }
      }

      const effectiveIntent = conv.intent || classification.intent;
      missingFields = getMissingFields(effectiveIntent, draftData);
      isComplete = missingFields.length === 0;

      if (Object.keys(draftData).length > 0) {
        conv = await updateCollectedData(organization_id, profile.id, draftData);
      }

      if (isComplete) {
        conv = await markConversationComplete(organization_id, profile.id);
      }

      draftReady = isComplete || Object.keys(draftData).length >= 2;
    }

    if (!isQuery) {
      const draftContent = buildHumanDraftMessage({
        intent: classification.intent,
        draftData,
        missingFields,
        draftReady,
        catalogs,
      });

      await addMessage(organization_id, profile.id, "assistant", draftContent);
      await auditLog({
        action: "chat_completion",
        payload: { text, organization_id, classification: classification.intent },
        result: { content: draftContent, deterministic: true },
        success: true,
        organization_id,
        created_by: profile.id,
      });

      return NextResponse.json({
        result: {
          content: draftContent,
          classification: { intent: classification.intent, actionType: classification.actionType, confidence: classification.confidence },
          conversationComplete: isComplete,
          draftReady,
          draft: draftData,
        },
      });
    }

    const intentLabel = getAiFinanceClassifierIntentLabel(classification.intent);
    const systemPrompt = buildSystemPrompt(
      classification.intent,
      draftData,
      missingFields,
      isComplete,
      catalogs,
    );

    const historyMessages = conv.messages
      .filter((m) => m.role !== "system")
      .slice(-10);

    let provider;
    try {
      provider = createAiProvider();
    } catch {
      const allCollected = Object.entries(draftData)
        .map(([k, v]) => `${friendlyFieldNames[k] || k}: ${v}`)
        .join(", ");

      let fallbackMessage: string;
      if (isQuery) {
        fallbackMessage = `Detectei ${intentLabel}, mas o assistente de IA nao esta habilitado. Nada foi salvo.`;
      } else if (missingFields.length > 0) {
        const friendly = getFriendlyNames(missingFields);
        fallbackMessage =
          `Detectei ${intentLabel}. Ainda faltam: ${friendly.join(", ")}.` +
          (allCollected ? ` Dados coletados: ${allCollected}.` : "") +
          " Tente incluir mais detalhes.";
      } else {
        fallbackMessage = `Detectei ${intentLabel}. Todos os campos foram preenchidos.` +
          (allCollected ? ` Dados: ${allCollected}.` : "") +
          " Revise no formulario para confirmar.";
      }

      return NextResponse.json({
        result: {
          content: fallbackMessage,
          classification: { intent: classification.intent, actionType: classification.actionType, confidence: classification.confidence },
          conversationComplete: isComplete,
          draftReady,
          draft: draftData,
        },
      });
    }

    const completion = await provider.complete({
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
      ],
      temperature: 0.5,
      maxTokens: 512,
    });

    await addMessage(organization_id, profile.id, "assistant", completion.content);

    if (isComplete) {
      await markConversationComplete(organization_id, profile.id);
    }

    await auditLog({
      action: "chat_completion",
      payload: { text, organization_id, classification: classification.intent },
      result: { content: completion.content, model: completion.model, usage: completion.usage },
      success: true,
      organization_id,
      created_by: profile.id,
    });

    return NextResponse.json({
      result: {
        content: completion.content,
        model: completion.model,
        usage: completion.usage,
        classification: { intent: classification.intent, actionType: classification.actionType, confidence: classification.confidence },
        conversationComplete: isComplete,
        draftReady,
        draft: draftData,
      },
    });
  } catch (err) {
    console.error("[API AI Chat] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
