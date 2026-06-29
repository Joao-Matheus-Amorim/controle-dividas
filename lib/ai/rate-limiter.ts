import "server-only";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    const elapsed = now - entry.windowStart;
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(1, WINDOW_MS - elapsed),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetInMs: WINDOW_MS - (now - entry.windowStart),
  };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function getRateLimitConfig() {
  return { windowMs: WINDOW_MS, maxRequests: MAX_REQUESTS };
}
