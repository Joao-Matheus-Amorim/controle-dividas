import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readLower(path: string) {
  return read(path).toLowerCase();
}

describe("AI provider guards", () => {
  const typesSource = read("lib/ai/provider/types.ts");
  const openrouterSource = read("lib/ai/provider/openrouter.ts");
  const factorySource = read("lib/ai/provider/factory.ts");
  const rateLimiterSource = read("lib/ai/rate-limiter.ts");
  const chatRouteSource = read("app/api/ai/chat/route.ts");
  const commandBarSource = read("components/ai/ai-command-bar.tsx");
  const packageJson = readLower("package.json");

  it("keeps the provider abstraction SDK-free", () => {
    expect(typesSource).toContain("AiProvider");
    expect(typesSource).toContain("AiCompletionParams");
    expect(typesSource).toContain("AiCompletionResult");
    expect(packageJson).not.toContain('"openai"');
    expect(packageJson).not.toContain('"@ai-sdk/openai"');
    expect(packageJson).not.toContain('"ai"');
    expect(packageJson).not.toContain('"@anthropic-ai/sdk"');
    expect(packageJson).not.toContain('"@google/generative-ai"');
  });

  it("keeps OpenRouter provider server-only and using fetch", () => {
    expect(openrouterSource).toContain('import "server-only"');
    expect(openrouterSource).toContain("fetch(");
    expect(openrouterSource).toContain("openrouter.ai");
    expect(openrouterSource).not.toContain("@ai-sdk");
    expect(openrouterSource).toContain("openai/gpt-4o-mini");
  });

  it("uses the config boundary in the factory for fail-closed behavior", () => {
    expect(factorySource).toContain("assertAiFinanceProviderConfigurationBoundary");
    expect(factorySource).toContain("openRouterProvider");
    expect(factorySource).toContain("openrouter");
  });

  it("rate limits by organization with in-memory store", () => {
    expect(rateLimiterSource).toContain("Map");
    expect(rateLimiterSource).toContain("checkRateLimit");
    expect(rateLimiterSource).toContain("WINDOW_MS");
    expect(rateLimiterSource).toContain("MAX_REQUESTS");
    expect(rateLimiterSource).toContain("allowed");
    expect(rateLimiterSource).toContain("remaining");
    expect(rateLimiterSource).toContain("resetInMs");
  });

  it("guards the chat endpoint with auth, permission, rate limit and audit", () => {
    expect(chatRouteSource).toContain("classifyAiFinanceIntent");
    expect(chatRouteSource).toContain("checkRateLimit");
    expect(chatRouteSource).toContain("createAiProvider");
    expect(chatRouteSource).toContain("auditLog");
    expect(chatRouteSource).toContain("getOrCreateConversation");
    expect(chatRouteSource).toContain("buildAiFinanceUniversalDraft");
    expect(chatRouteSource).not.toContain("createExpense");
    expect(chatRouteSource).not.toContain("createPayableBill");
  });

  it("connects the command bar to the chat endpoint for all intents", () => {
    expect(commandBarSource).toContain("/api/ai/chat");
    expect(commandBarSource).toContain("organizationId");
    expect(commandBarSource).toContain("Loader2");
    expect(commandBarSource).toContain("loading");
  });

  it("documents AI-07 in the living roadmap", () => {
    const roadmap = readLower("docs/audits/AI_COPILOT_ROADMAP.md");
    expect(roadmap).toContain("ai-07");
    expect(roadmap).toContain("openrouter");
    expect(roadmap).toContain("lib/ai/provider/");
    expect(roadmap).toContain("lib/ai/rate-limiter.ts");
    expect(roadmap).toContain("app/api/ai/chat/");
  });

  it("registers the provider endpoint in living docs", () => {
    const providerContract = readLower("docs/audits/AI_FINANCE_PROVIDER_ENDPOINT_CONTRACT.md");
    expect(providerContract).toContain("lib/ai/provider/");
    expect(providerContract).toContain("/api/ai/chat");
    expect(providerContract).toContain("lib/ai/rate-limiter.ts");
  });
});
