import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  claimsUserId: "user-1" as string | null,
  claimsError: null as { message: string } | null,
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  updateUserCalls: [] as Array<Record<string, unknown>>,
  updateUserError: null as { message: string } | null,
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
      getClaims: vi.fn(async () => ({
        data: mockState.claimsUserId
          ? { claims: { sub: mockState.claimsUserId } }
          : { claims: null },
        error: mockState.claimsError,
      })),
      updateUser: vi.fn(async (input: Record<string, unknown>) => {
        mockState.updateUserCalls.push(input);

        return { error: mockState.updateUserError };
      }),
    },
  })),
}));

describe("auth password update rate limit runtime actions", () => {
  beforeEach(() => {
    mockState.claimsUserId = "user-1";
    mockState.claimsError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.updateUserCalls = [];
    mockState.updateUserError = null;
    vi.resetModules();
  });

  it("rate limits password updates by current auth user before Supabase update", async () => {
    const { updatePassword } = await import("@/app/auth/update-password/actions");

    await expect(updatePassword("secret-123")).resolves.toEqual({ success: true });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_update.submit",
        actorKey: "user-1",
        organizationId: "public-auth",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      }),
    ]);
    expect(mockState.updateUserCalls).toEqual([{ password: "secret-123" }]);
  });

  it("does not update the password when rate limit denies", async () => {
    const { updatePassword } = await import("@/app/auth/update-password/actions");
    mockState.rateLimitAllowed = false;

    await expect(updatePassword("secret-123")).resolves.toEqual({
      success: false,
      error: "Muitas tentativas de atualizacao de senha. Tente novamente em alguns minutos.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_update.submit",
        actorKey: "user-1",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.updateUserCalls).toHaveLength(0);
  });

  it("does not update the password without a valid recovery session", async () => {
    const { updatePassword } = await import("@/app/auth/update-password/actions");
    mockState.claimsUserId = null;

    await expect(updatePassword("secret-123")).resolves.toEqual({
      success: false,
      error: "Sessao de recuperacao expirada. Solicite um novo link de recuperacao.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_update.submit",
        actorKey: "missing-session",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.updateUserCalls).toHaveLength(0);
  });

  it("rejects malformed passwords before Supabase update", async () => {
    const { updatePassword } = await import("@/app/auth/update-password/actions");

    await expect(updatePassword(null)).resolves.toEqual({
      success: false,
      error: "A nova senha precisa ter pelo menos 6 caracteres.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.password_update.submit",
        actorKey: "user-1",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.updateUserCalls).toHaveLength(0);
  });
});
