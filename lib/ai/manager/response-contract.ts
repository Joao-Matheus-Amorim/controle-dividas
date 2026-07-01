export type AiResponseType = "message" | "confirmation" | "error" | "action_result";

export type AiActionStatus = "pending" | "confirmed" | "executed" | "rejected";

export type AiActionSummary = {
  type: string;
  status: AiActionStatus;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

export type AiResponse = {
  content: string;
  type: AiResponseType;
  action?: AiActionSummary;
  classification?: { intent: string; confidence: string };
  conversationComplete?: boolean;
  draftReady?: boolean;
  draft?: Record<string, unknown>;
};

export function buildMessageResponse(content: string): AiResponse {
  return { content, type: "message" };
}

export function buildConfirmationResponse(
  content: string,
  actionType: string,
  summary: string,
  after: Record<string, unknown>,
  before?: Record<string, unknown>,
): AiResponse {
  return {
    content,
    type: "confirmation",
    action: { type: actionType, status: "pending", summary, before, after },
  };
}

export function buildActionResultResponse(
  content: string,
  actionType: string,
  status: AiActionStatus,
  summary: string,
  after?: Record<string, unknown>,
): AiResponse {
  return {
    content,
    type: "action_result",
    action: { type: actionType, status, summary, after },
  };
}

export function buildErrorResponse(content: string): AiResponse {
  return { content, type: "error" };
}
