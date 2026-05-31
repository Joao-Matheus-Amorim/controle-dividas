import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  signInCalls: [] as Array<Record<string, unknown>>,
  signInError: null as { message: string } | null,
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
      signInWithPassword: vi.fn(async (input: Record<string, unknown>) => {
        mockState.signInCalls.push(input);

        return { error: mockState.signInError };
      }),
    },
  })),
}));

describe("auth login rate limit runtime actions", () => {
  beforeEach(() => {
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.signInCalls = [];
    mockState.signInError = null;
    vi.resetModules();
  });

  it("rate limits password login by normalized email before Supabase sign in", async () => {
    const { loginWithPassword } = await import("@/app/auth/login/actions");

    await expect(loginWithPassword("  MARIA@example.com  ", "secret-123")).resolves.toEqual({ success: true });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.login.password",
        actorKey: "maria@example.com",
        organizationId: "public-auth",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      }),
    ]);
    expect(mockState.signInCalls).toEqual([
      {
        email: "maria@example.com",
        password: "secret-123",
      },
    ]);
  });

  it("does not call Supabase sign in when login rate limit denies", async () => {
    const { loginWithPassword } = await import("@/app/auth/login/actions");
    mockState.rateLimitAllowed = false;

    await expect(loginWithPassword("maria@example.com", "secret-123")).resolves.toEqual({
      success: false,
      error: "Muitas tentativas de entrada. Tente novamente em alguns minutos.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.login.password",
        actorKey: "maria@example.com",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.signInCalls).toHaveLength(0);
  });

  it("rejects missing login emails in one shared bucket before Supabase sign in", async () => {
    const { loginWithPassword } = await import("@/app/auth/login/actions");

    await expect(loginWithPassword(null, "secret-123")).resolves.toEqual({
      success: false,
      error: "Informe o email.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.login.password",
        actorKey: "missing-email",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.signInCalls).toHaveLength(0);
  });

  it("rejects malformed login emails in one shared bucket before Supabase sign in", async () => {
    const { loginWithPassword } = await import("@/app/auth/login/actions");

    await expect(loginWithPassword("not-an-email", "secret-123")).resolves.toEqual({
      success: false,
      error: "Informe um email valido.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.login.password",
        actorKey: "invalid-email",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.signInCalls).toHaveLength(0);
  });

  it("rejects missing passwords before Supabase sign in after consuming the login bucket", async () => {
    const { loginWithPassword } = await import("@/app/auth/login/actions");

    await expect(loginWithPassword("maria@example.com", null)).resolves.toEqual({
      success: false,
      error: "Informe a senha.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.login.password",
        actorKey: "maria@example.com",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.signInCalls).toHaveLength(0);
  });
});
