import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  verifyOtpCalls: [] as Array<Record<string, unknown>>,
  claims: {
    sub: "auth-user-1",
    email: "maria@example.com",
  } as Record<string, unknown> | null,
  linkCalls: [] as Array<Record<string, unknown>>,
}));

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return {
    url,
    headers: new Headers(headers),
  };
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 9, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      verifyOtp: vi.fn(async (input: Record<string, unknown>) => {
        mockState.verifyOtpCalls.push(input);

        return { error: null };
      }),
      getClaims: vi.fn(async () => ({
        data: { claims: mockState.claims },
        error: null,
      })),
    },
  })),
}));

vi.mock("@/lib/finance/profile-linking", () => ({
  linkAuthUserToFamilyProfile: vi.fn(async (input: Record<string, unknown>) => {
    mockState.linkCalls.push(input);

    return { linked: true, reason: "linked" };
  }),
}));

describe("auth confirm rate limit runtime actions", () => {
  beforeEach(() => {
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.verifyOtpCalls = [];
    mockState.claims = {
      sub: "auth-user-1",
      email: "maria@example.com",
    };
    mockState.linkCalls = [];
    vi.resetModules();
  });

  it("rate limits auth confirmation by public client actor before verifying the OTP", async () => {
    const { GET } = await import("@/app/auth/confirm/route");

    await expect(
      GET(makeRequest(
        "https://app.example.com/auth/confirm?token_hash=token-1&type=signup&next=/protected",
        { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
      ) as never),
    ).rejects.toThrow("redirect:/protected");

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.confirm.verify",
        actorKey: "203.0.113.10",
        organizationId: "public-auth",
        targetKey: "signup",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      }),
    ]);
    expect(mockState.verifyOtpCalls).toEqual([{ type: "signup", token_hash: "token-1" }]);
    expect(mockState.linkCalls).toEqual([
      {
        authUserId: "auth-user-1",
        email: "maria@example.com",
      },
    ]);
  });

  it("does not verify OTP when auth confirmation rate limit denies", async () => {
    const { GET } = await import("@/app/auth/confirm/route");
    mockState.rateLimitAllowed = false;

    await expect(
      GET(makeRequest(
        "https://app.example.com/auth/confirm?token_hash=token-1&type=signup",
        { "x-real-ip": "198.51.100.7" },
      ) as never),
    ).rejects.toThrow("redirect:/auth/error?error=Muitas tentativas de confirmacao");

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.confirm.verify",
        actorKey: "198.51.100.7",
        organizationId: "public-auth",
        targetKey: "signup",
      }),
    ]);
    expect(mockState.verifyOtpCalls).toHaveLength(0);
    expect(mockState.linkCalls).toHaveLength(0);
  });
});
