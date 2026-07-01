import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("AI actions endpoint guards", () => {
  const actionsRoute = read("app/api/ai/actions/route.ts");
  const rateLimiter = read("lib/ai/rate-limiter.ts");
  const newMigration = read("supabase/migrations/073_alter_ai_conversations_intent_constraint.sql");
  const swJs = read("public/sw.js");
  const chatRoute = read("app/api/ai/chat/route.ts");
  const conversationMigration = read("supabase/migrations/072_ai_conversations.sql");

  it("no longer uses pending confirmation map in actions route", () => {
    expect(actionsRoute).not.toContain("pendingConfirmations");
    expect(actionsRoute).not.toContain("confirmationId");
    expect(actionsRoute).not.toContain("EXPIRATION_MS");
    expect(actionsRoute).not.toContain("stored.actionType");
    expect(actionsRoute).not.toContain("Nenhuma confirmacao pendente");
  });

  it("rate limiter queries persisted AI action events", () => {
    expect(rateLimiter).toContain('.from("ai_actions")');
    expect(rateLimiter).toContain('.eq("created_by", key)');
    expect(rateLimiter).toContain("allowed: false");
    expect(rateLimiter).not.toContain('.from("ai_conversations")');
    expect(rateLimiter).not.toContain('.eq("profile_id", key)');
    expect(rateLimiter).not.toContain('.eq("user_id", key)');
  });

  it("actions route uses profile.id as rate limit key", () => {
    expect(actionsRoute).toContain("const rateLimitKey = profile.id;");
    expect(actionsRoute).not.toContain("const rateLimitKey = auth.user.id;");
  });

  it("actions route requires explicit confirmed confirmation", () => {
    expect(actionsRoute).toContain('confirmation !== "confirmado"');
    expect(actionsRoute).toContain("confirmation_required");
    expect(actionsRoute).toContain("result.needsConfirmation");
    expect(actionsRoute).toContain("review_required");
  });

  it("new migration allows acao_pagamento in intent check constraint", () => {
    expect(newMigration).toContain("acao_pagamento");
    expect(newMigration).toContain("drop constraint if exists ai_conversations_intent_check");
    expect(newMigration).toContain("add constraint ai_conversations_intent_check");
  });

  it("service worker excludes protected routes from navigation cache", () => {
    expect(swJs).toContain('/protected"');
    expect(swJs).toContain("/org/");
    expect(swJs).toContain("/auth/");
    expect(swJs).toContain('/login"');
    expect(swJs).toContain('var CACHE_NAME = "family-finance-v2"');
    expect(swJs).toContain("isAuthenticatedRoute");
    expect(swJs).toContain('event.respondWith(fetch(request).catch(function () { return caches.match("/offline"); }));');
  });

  it("service worker still caches public navigations", () => {
    expect(swJs).toContain("fetchAndCache(request)");
    expect(swJs).toContain('/offline"');
  });

  it("chat route limits multi-match options to 10", () => {
    const sliceCount = (chatRoute.match(/\.slice\(0, 10\)/g) || []).length;
    expect(sliceCount).toBeGreaterThanOrEqual(8);
  });

  it("chat route still queries up to 50 for matching", () => {
    const limitCount = (chatRoute.match(/\.limit\(50\)/g) || []).length;
    expect(limitCount).toBeGreaterThanOrEqual(8);
  });

  it("original migration constraint does not include acao_pagamento", () => {
    expect(conversationMigration).not.toContain("acao_pagamento");
    expect(conversationMigration).toContain("check (intent in");
  });
});
