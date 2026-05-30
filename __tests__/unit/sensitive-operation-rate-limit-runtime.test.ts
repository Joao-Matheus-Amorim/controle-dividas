import { afterEach, describe, expect, it } from "vitest";

import {
  checkSensitiveOperationRateLimit,
  getSensitiveOperationRateLimitBucketCountForTests,
  resetSensitiveOperationRateLimitStateForTests,
} from "@/lib/security/sensitive-rate-limit";

describe("sensitive operation rate limit runtime", () => {
  afterEach(() => {
    delete process.env.DISABLE_SENSITIVE_RATE_LIMITS;
    resetSensitiveOperationRateLimitStateForTests();
  });

  it("allows requests until the fixed window threshold is reached", () => {
    const input = {
      operationKey: "billing.checkout.start",
      actorKey: "user-1",
      organizationId: "org-1",
      targetKey: "premium",
      limit: 2,
      windowMs: 1000,
      now: 100,
    };

    expect(checkSensitiveOperationRateLimit(input)).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 1100,
    });
    expect(checkSensitiveOperationRateLimit({ ...input, now: 200 })).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 1100,
    });
    expect(checkSensitiveOperationRateLimit({ ...input, now: 300 })).toEqual({
      allowed: false,
      retryAfterMs: 800,
      resetAt: 1100,
    });
  });

  it("resets the bucket after the window expires", () => {
    const input = {
      operationKey: "billing.checkout.start",
      actorKey: "user-1",
      organizationId: "org-1",
      limit: 1,
      windowMs: 1000,
      now: 100,
    };

    expect(checkSensitiveOperationRateLimit(input).allowed).toBe(true);
    expect(checkSensitiveOperationRateLimit({ ...input, now: 200 }).allowed).toBe(false);
    expect(checkSensitiveOperationRateLimit({ ...input, now: 1200 })).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 2200,
    });
  });

  it("keeps actor, organization, operation, and target isolated", () => {
    const input = {
      operationKey: "billing.checkout.start",
      actorKey: "user-1",
      organizationId: "org-1",
      targetKey: "premium",
      limit: 1,
      windowMs: 1000,
      now: 100,
    };

    expect(checkSensitiveOperationRateLimit(input).allowed).toBe(true);
    expect(checkSensitiveOperationRateLimit({ ...input, actorKey: "user-2" }).allowed).toBe(true);
    expect(checkSensitiveOperationRateLimit({ ...input, organizationId: "org-2" }).allowed).toBe(true);
    expect(checkSensitiveOperationRateLimit({ ...input, targetKey: "business" }).allowed).toBe(true);
    expect(checkSensitiveOperationRateLimit(input).allowed).toBe(false);
  });

  it("evicts expired buckets before tracking new traffic", () => {
    const input = {
      operationKey: "billing.checkout.start",
      actorKey: "user-1",
      organizationId: "org-1",
      targetKey: "premium",
      limit: 1,
      windowMs: 1000,
      now: 100,
    };

    expect(checkSensitiveOperationRateLimit(input).allowed).toBe(true);
    expect(
      checkSensitiveOperationRateLimit({
        ...input,
        actorKey: "user-2",
        targetKey: "business",
      }).allowed,
    ).toBe(true);
    expect(getSensitiveOperationRateLimitBucketCountForTests()).toBe(2);

    expect(
      checkSensitiveOperationRateLimit({
        ...input,
        actorKey: "user-3",
        targetKey: "starter",
        now: 1200,
      }).allowed,
    ).toBe(true);
    expect(getSensitiveOperationRateLimitBucketCountForTests()).toBe(1);
  });

  it("can check a bucket without consuming quota", () => {
    const input = {
      operationKey: "finance.bank.update",
      actorKey: "user-1",
      organizationId: "org-1",
      targetKey: "bank-1",
      limit: 2,
      windowMs: 1000,
      now: 100,
    };

    expect(checkSensitiveOperationRateLimit({ ...input, consume: false })).toEqual({
      allowed: true,
      remaining: 2,
      resetAt: 1100,
    });
    expect(getSensitiveOperationRateLimitBucketCountForTests()).toBe(0);

    expect(checkSensitiveOperationRateLimit(input)).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 1100,
    });
    expect(checkSensitiveOperationRateLimit({ ...input, now: 200, consume: false })).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 1100,
    });
    expect(checkSensitiveOperationRateLimit({ ...input, now: 300 })).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 1100,
    });
  });

  it("can be disabled through the documented rollback env flag", () => {
    process.env.DISABLE_SENSITIVE_RATE_LIMITS = "true";

    const input = {
      operationKey: "billing.checkout.start",
      actorKey: "user-1",
      organizationId: "org-1",
      limit: 1,
      windowMs: 1000,
      now: 100,
    };

    expect(checkSensitiveOperationRateLimit(input).allowed).toBe(true);
    expect(checkSensitiveOperationRateLimit(input).allowed).toBe(true);
  });
});
