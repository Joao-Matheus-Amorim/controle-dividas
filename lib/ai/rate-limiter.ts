import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export async function checkRateLimit(key: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from("ai_conversations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", key)
    .gte("created_at", cutoff);

  if (error) {
    return { allowed: true, remaining: MAX_REQUESTS, resetInMs: WINDOW_MS };
  }

  const used = count ?? 0;
  const allowed = used < MAX_REQUESTS;
  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS - used),
    resetInMs: WINDOW_MS,
  };
}

export function getRateLimitConfig() {
  return { windowMs: WINDOW_MS, maxRequests: MAX_REQUESTS };
}
