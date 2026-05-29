type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type SensitiveOperationRateLimitInput = {
  operationKey: string;
  actorKey: string;
  organizationId: string;
  targetKey?: string | null;
  limit: number;
  windowMs: number;
  now?: number;
};

type SensitiveOperationRateLimitResult =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      retryAfterMs: number;
      resetAt: number;
    };

const buckets = new Map<string, RateLimitBucket>();

function disableSensitiveRateLimits() {
  return process.env.DISABLE_SENSITIVE_RATE_LIMITS === "true";
}

function encodeKeyPart(value: string) {
  return encodeURIComponent(value.trim() || "unknown");
}

function buildRateLimitKey({
  operationKey,
  actorKey,
  organizationId,
  targetKey,
}: Pick<SensitiveOperationRateLimitInput, "operationKey" | "actorKey" | "organizationId" | "targetKey">) {
  return [
    "sensitive-operation",
    encodeKeyPart(operationKey),
    encodeKeyPart(actorKey),
    encodeKeyPart(organizationId),
    encodeKeyPart(targetKey ?? "all"),
  ].join(":");
}

function sweepExpiredRateLimitBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkSensitiveOperationRateLimit({
  operationKey,
  actorKey,
  organizationId,
  targetKey = null,
  limit,
  windowMs,
  now = Date.now(),
}: SensitiveOperationRateLimitInput): SensitiveOperationRateLimitResult {
  if (disableSensitiveRateLimits()) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + windowMs,
    };
  }

  sweepExpiredRateLimitBuckets(now);

  const key = buildRateLimitKey({ operationKey, actorKey, organizationId, targetKey });
  const currentBucket = buckets.get(key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      resetAt: now + windowMs,
    };
  }

  if (currentBucket.count >= limit) {
    return {
      allowed: false,
      retryAfterMs: Math.max(currentBucket.resetAt - now, 0),
      resetAt: currentBucket.resetAt,
    };
  }

  currentBucket.count += 1;

  return {
    allowed: true,
    remaining: Math.max(limit - currentBucket.count, 0),
    resetAt: currentBucket.resetAt,
  };
}

export function resetSensitiveOperationRateLimitStateForTests() {
  buckets.clear();
}

export function getSensitiveOperationRateLimitBucketCountForTests() {
  return buckets.size;
}
