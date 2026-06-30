import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ConversationMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ConversationIntent = "gasto" | "conta_a_pagar" | "conta_a_receber" | "banco" | "acao_pagamento" | "pergunta" | null;

export type Conversation = {
  id: string;
  orgId: string;
  userId: string;
  intent: ConversationIntent;
  messages: ConversationMessage[];
  collectedData: Record<string, unknown>;
  isComplete: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
};

type ConversationRow = {
  id: string;
  organization_id: string;
  profile_id: string;
  intent: ConversationIntent;
  messages: ConversationMessage[] | null;
  collected_data: Record<string, unknown> | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

const RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_MESSAGES = 20;

function expiresAt(): string {
  return new Date(Date.now() + RETENTION_MS).toISOString();
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    orgId: row.organization_id,
    userId: row.profile_id,
    intent: row.intent,
    messages: Array.isArray(row.messages) ? row.messages : [],
    collectedData: row.collected_data ?? {},
    isComplete: row.is_complete,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    expiresAt: Date.parse(row.expires_at),
  };
}

async function deleteExpiredConversation(orgId: string, userId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("ai_conversations")
    .delete()
    .eq("organization_id", orgId)
    .eq("profile_id", userId)
    .lte("expires_at", new Date().toISOString());
}

export async function getOrCreateConversation(orgId: string, userId: string): Promise<Conversation> {
  await deleteExpiredConversation(orgId, userId);

  const supabase = createAdminClient();
  const { data: existing, error: selectError } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("organization_id", orgId)
    .eq("profile_id", userId)
    .maybeSingle<ConversationRow>();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    return toConversation(existing);
  }

  const { data: created, error: insertError } = await supabase
    .from("ai_conversations")
    .insert({
      organization_id: orgId,
      profile_id: userId,
      messages: [],
      collected_data: {},
      expires_at: expiresAt(),
    })
    .select("*")
    .single<ConversationRow>();

  if (insertError || !created) {
    throw insertError ?? new Error("Failed to create AI conversation");
  }

  return toConversation(created);
}

export async function addMessage(
  orgId: string,
  userId: string,
  role: ConversationMessage["role"],
  content: string,
): Promise<Conversation> {
  const conv = await getOrCreateConversation(orgId, userId);
  const messages = [...conv.messages, { role, content }].slice(-MAX_MESSAGES);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .update({
      messages,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt(),
    })
    .eq("id", conv.id)
    .select("*")
    .single<ConversationRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to append AI conversation message");
  }

  return toConversation(data);
}

export async function setConversationIntent(
  orgId: string,
  userId: string,
  intent: NonNullable<ConversationIntent>,
): Promise<Conversation> {
  const conv = await getOrCreateConversation(orgId, userId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .update({
      intent,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt(),
    })
    .eq("id", conv.id)
    .select("*")
    .single<ConversationRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to update AI conversation intent");
  }

  return toConversation(data);
}

export async function updateCollectedData(
  orgId: string,
  userId: string,
  data: Record<string, unknown>,
): Promise<Conversation> {
  const conv = await getOrCreateConversation(orgId, userId);
  const collectedData = { ...conv.collectedData, ...data };
  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("ai_conversations")
    .update({
      collected_data: collectedData,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt(),
    })
    .eq("id", conv.id)
    .select("*")
    .single<ConversationRow>();

  if (error || !updated) {
    throw error ?? new Error("Failed to update AI conversation data");
  }

  return toConversation(updated);
}

export async function markConversationComplete(orgId: string, userId: string): Promise<Conversation> {
  const conv = await getOrCreateConversation(orgId, userId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .update({
      is_complete: true,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt(),
    })
    .eq("id", conv.id)
    .select("*")
    .single<ConversationRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to mark AI conversation complete");
  }

  return toConversation(data);
}

export async function clearConversation(orgId: string, userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("organization_id", orgId)
    .eq("profile_id", userId);

  if (error) {
    throw error;
  }
}
