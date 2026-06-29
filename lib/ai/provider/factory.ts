import "server-only";

import { assertAiFinanceProviderConfigurationBoundary } from "@/lib/finance/ai-finance-provider-config";
import type { AiProvider } from "./types";
import { openRouterProvider } from "./openrouter";

const providerMap: Record<string, AiProvider> = {
  openrouter: openRouterProvider,
};

export function createAiProvider(): AiProvider {
  const boundary = assertAiFinanceProviderConfigurationBoundary();

  if (!boundary.providerEnabled || !boundary.ready) {
    throw new Error(
      "AI provider is not enabled or not configured. Set ENABLE_AI_FINANCE_PROVIDER=true and configure AI_PROVIDER, AI_API_KEY, and AI_MODEL.",
    );
  }

  const providerName =
    process.env.AI_PROVIDER?.trim() || "openrouter";
  const provider = providerMap[providerName];

  if (!provider) {
    throw new Error(
      `Unknown AI provider: "${providerName}". Supported: ${Object.keys(providerMap).join(", ")}`,
    );
  }

  return provider;
}
