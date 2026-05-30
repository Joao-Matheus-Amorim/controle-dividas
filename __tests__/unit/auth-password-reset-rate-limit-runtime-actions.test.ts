import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  resetPasswordCalls: [] as Array<{ email: string; options?: Record<string, unknown> }>,
  resetPasswordError: null as { message: string } | null,
  requestHeaders: new Headers({
    origin: "https://app.example.com",
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => mockState.requestHeaders),
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
      resetPasswordForEmail: vi.fn(async (email: string, options?: Record<string, unknown>) => {
        mockState.resetPasswordCalls.push({ email, options });

        return { error: mockState.resetPasswordError };
      }),
    },
  })),
}));

describe("auth password reset rate limit runtime actions", () => {
  beforeEach(() => {
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.resetPasswordCalls = [];
    mockState.resetPasswordError = null;
    mockState.requestHeaders = new Headers({
      origin: "https://app.example.com",
    });
    vi.resetModules();
  });

  it("rate limits password reset requests by normalized email before requesting reset", async () => {
    const { requestPasswordReset } = await import("@/app/auth/forgot-password/actions");

    await expect(requestPasswordReset("  MARIA@example.com  ")).resolves.toEqual({ success: true });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_reset.request",
        actorKey: "maria@example.com",
        organizationId: "public-auth",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      }),
    ]);
    expect(mockState.resetPasswordCalls).toEqual([
      {
        email: "maria@example.com",
        options: {
          redirectTo: "https://app.example.com/auth/update-password",
        },
      },
    ]);
  });

  it("does not request password reset when rate limit denies", async () => {
    const { requestPasswordReset } = await import("@/app/auth/forgot-password/actions");
    mockState.rateLimitAllowed = false;

    await expect(requestPasswordReset("maria@example.com")).resolves.toEqual({
      success: false,
      error: "Muitas tentativas de recuperacao de senha. Tente novamente em alguns minutos.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_reset.request",
        actorKey: "maria@example.com",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.resetPasswordCalls).toHaveLength(0);
  });

  it("handles missing password reset emails without throwing before rate limit", async () => {
    const { requestPasswordReset } = await import("@/app/auth/forgot-password/actions");

    await expect(requestPasswordReset(null)).resolves.toEqual({
      success: false,
      error: "Informe o email cadastrado.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_reset.request",
        actorKey: "missing-email",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.resetPasswordCalls).toHaveLength(0);
  });

  it("rejects malformed password reset emails in one shared bucket before Supabase reset", async () => {
    const { requestPasswordReset } = await import("@/app/auth/forgot-password/actions");

    await expect(requestPasswordReset("not-an-email")).resolves.toEqual({
      success: false,
      error: "Informe um email valido.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_reset.request",
        actorKey: "invalid-email",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.resetPasswordCalls).toHaveLength(0);
  });
});
