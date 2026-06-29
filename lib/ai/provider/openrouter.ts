import "server-only";

import type { AiProvider, AiCompletionParams, AiCompletionResult } from "./types";

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

function getApiKey(): string {
  const key =
    process.env.AI_API_KEY?.trim() ||
    process.env.OPENROUTER_API_KEY?.trim() ||
    "";
  if (!key) {
    throw new Error(
      "OpenRouter API key not configured. Set AI_API_KEY or OPENROUTER_API_KEY.",
    );
  }
  return key;
}

function getModel(): string {
  return (
    process.env.AI_MODEL?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    "google/gemini-pro"
  );
}

export const openRouterProvider: AiProvider = {
  name: "openrouter",

  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    const apiKey = getApiKey();
    const model = params.model || getModel();

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://controle-dividas.vercel.app",
        "X-Title": "FamilyFinance",
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        max_tokens: params.maxTokens ?? 1024,
        temperature: params.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorBody}`,
      );
    }

    const json = (await response.json()) as {
      choices: { message: { content: string } }[];
      model: string;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    return {
      content: json.choices?.[0]?.message?.content ?? "",
      model: json.model ?? model,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.completion_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  },
};
