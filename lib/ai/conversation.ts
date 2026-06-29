import "server-only";

export type ConversationMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ConversationIntent = "gasto" | "conta_a_pagar" | "conta_a_receber" | "banco" | "pergunta" | null;

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
};

type ConversationKey = `${string}:${string}`;

const conversations = new Map<ConversationKey, Conversation>();

function key(orgId: string, userId: string): ConversationKey {
  return `${orgId}:${userId}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function getOrCreateConversation(orgId: string, userId: string): Conversation {
  const k = key(orgId, userId);
  let conv = conversations.get(k);
  if (!conv) {
    conv = {
      id: generateId(),
      orgId,
      userId,
      intent: null,
      messages: [],
      collectedData: {},
      isComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    conversations.set(k, conv);
  }
  return conv;
}

export function addMessage(orgId: string, userId: string, role: ConversationMessage["role"], content: string): Conversation {
  const conv = getOrCreateConversation(orgId, userId);
  conv.messages.push({ role, content });
  conv.updatedAt = Date.now();
  return conv;
}

export function setConversationIntent(orgId: string, userId: string, intent: NonNullable<ConversationIntent>): Conversation {
  const conv = getOrCreateConversation(orgId, userId);
  conv.intent = intent;
  conv.updatedAt = Date.now();
  return conv;
}

export function updateCollectedData(orgId: string, userId: string, data: Record<string, unknown>): Conversation {
  const conv = getOrCreateConversation(orgId, userId);
  Object.assign(conv.collectedData, data);
  conv.updatedAt = Date.now();
  return conv;
}

export function markConversationComplete(orgId: string, userId: string): Conversation {
  const conv = getOrCreateConversation(orgId, userId);
  conv.isComplete = true;
  conv.updatedAt = Date.now();
  return conv;
}

export function clearConversation(orgId: string, userId: string): void {
  const k = key(orgId, userId);
  conversations.delete(k);
}
