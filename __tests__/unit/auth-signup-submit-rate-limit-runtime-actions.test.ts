import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  profiles: [] as Array<Record<string, unknown>>,
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  signUpCalls: [] as Array<Record<string, unknown>>,
  signUpError: null as { message: string } | null,
  selectError: null as { message: string } | null,
  requestHeaders: new Headers({
    origin: "https://app.example.com",
  }),
}));

function makeProfilesQuery() {
  const query = {
    select() {
      return query;
    },
    ilike() {
      return query;
    },
    limit(value: number) {
      return Promise.resolve({
        data: mockState.profiles.slice(0, value),
        error: mockState.selectError,
      });
    },
  };

  return query;
}

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => mockState.requestHeaders),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from(table: string) {
      if (table !== "profiles") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeProfilesQuery();
    },
  })),
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
      signUp: vi.fn(async (input: Record<string, unknown>) => {
        mockState.signUpCalls.push(input);

        return { error: mockState.signUpError };
      }),
    },
  })),
}));

function profile(overrides: Record<string, unknown> = {}) {
  return {
    id: "profile-1",
    owner_id: "owner-1",
    organization_id: "org-1",
    auth_user_id: null,
    linked_family_member_id: "member-1",
    name: "Maria",
    email: "maria@example.com",
    role: "user",
    is_active: true,
    ...overrides,
  };
}

describe("auth signup submit rate limit runtime actions", () => {
  beforeEach(() => {
    mockState.profiles = [];
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.signUpCalls = [];
    mockState.signUpError = null;
    mockState.selectError = null;
    mockState.requestHeaders = new Headers({
      origin: "https://app.example.com",
    });
    vi.resetModules();
  });

  it("rate limits authorized signup submissions before Supabase sign up", async () => {
    const { createAuthorizedFamilyAccess } = await import("@/app/auth/sign-up/actions");
    mockState.profiles = [profile()];

    await expect(createAuthorizedFamilyAccess("  MARIA@example.com  ", "secret-123")).resolves.toEqual({
      allowed: true,
      name: "Maria",
      role: "user",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.signup.submit",
        actorKey: "maria@example.com",
        organizationId: "public-auth",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      }),
    ]);
    expect(mockState.signUpCalls).toEqual([
      {
        email: "maria@example.com",
        password: "secret-123",
        options: {
          emailRedirectTo: "https://app.example.com/auth/confirm?next=/protected",
        },
      },
    ]);
  });

  it("does not call Supabase sign up when signup submit rate limit denies", async () => {
    const { createAuthorizedFamilyAccess } = await import("@/app/auth/sign-up/actions");
    mockState.rateLimitAllowed = false;
    mockState.profiles = [profile()];

    await expect(createAuthorizedFamilyAccess("maria@example.com", "secret-123")).resolves.toEqual({
      allowed: false,
      error: "Muitas tentativas de criacao de acesso. Tente novamente em alguns minutos.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.signup.submit",
        actorKey: "maria@example.com",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.signUpCalls).toHaveLength(0);
  });

  it("rejects malformed signup emails in one shared bucket before Supabase sign up", async () => {
    const { createAuthorizedFamilyAccess } = await import("@/app/auth/sign-up/actions");

    await expect(createAuthorizedFamilyAccess("not-an-email", "secret-123")).resolves.toEqual({
      allowed: false,
      error: "Informe um email valido.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "auth.signup.submit",
        actorKey: "invalid-email",
        organizationId: "public-auth",
      }),
    ]);
    expect(mockState.signUpCalls).toHaveLength(0);
  });

  it("keeps direct signup submissions behind the authorized profile lookup", async () => {
    const { createAuthorizedFamilyAccess } = await import("@/app/auth/sign-up/actions");

    await expect(createAuthorizedFamilyAccess("outsider@example.com", "secret-123")).resolves.toEqual({
      allowed: false,
      error: "Este email ainda nao foi autorizado pelo Admin familiar.",
    });

    expect(mockState.signUpCalls).toHaveLength(0);
  });
});
