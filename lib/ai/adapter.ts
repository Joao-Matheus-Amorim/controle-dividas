import { createAiProvider } from "@/lib/ai/provider";
import type { AiCompletionResult } from "@/lib/ai/provider/types";

export async function generateCompletion(
  prompt: string,
  _params: Record<string, unknown> = {},
): Promise<AiCompletionResult> {
  const provider = createAiProvider();

  return provider.complete({
    messages: [{ role: "user", content: prompt }],
  });
}