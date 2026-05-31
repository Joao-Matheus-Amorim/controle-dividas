import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  claimsUserId: "user-1" as string | null,
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  rpcCalls: [] as Array<{ name: string; params: Record<string, unknown> }>,
  rpcError: null as { message: string } | null,
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 4, resetAt: 1000 }
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
        error: null,
      })),
    },
    rpc: vi.fn(async (name: string, params: Record<string, unknown>) => {
      mockState.rpcCalls.push({ name, params });

      return { error: mockState.rpcError };
    }),
  })),
}));

function formData(input: Record<string, string>) {
  const form = new FormData();

  for (const [key, value] of Object.entries(input)) {
    form.set(key, value);
  }

  return form;
}

describe("onboarding organization rate limit runtime actions", () => {
  beforeEach(() => {
    mockState.claimsUserId = "user-1";
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.rpcCalls = [];
    mockState.rpcError = null;
    vi.resetModules();
  });

  it("rate limits initial organization onboarding before the transactional RPC", async () => {
    const { createInitialOrganizationFromOnboarding } = await import("@/app/onboarding/organizacao/actions");

    await expect(
      createInitialOrganizationFromOnboarding(
        {},
        formData({
          organization_name: "Familia Amorim",
          organization_slug: "familia-amorim",
        }),
      ),
    ).resolves.toEqual({ success: "Organiza\u00e7\u00e3o criada com sucesso." });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "onboarding.organization.create",
        actorKey: "user-1",
        organizationId: "onboarding",
        limit: 5,
        windowMs: 10 * 60 * 1000,
      }),
    ]);
    expect(mockState.rpcCalls).toEqual([
      {
        name: "create_initial_organization_onboarding",
        params: {
          p_name: "Familia Amorim",
          p_slug: "familia-amorim",
        },
      },
    ]);
  });

  it("does not call the onboarding RPC when rate limit denies", async () => {
    const { createInitialOrganizationFromOnboarding } = await import("@/app/onboarding/organizacao/actions");
    mockState.rateLimitAllowed = false;

    await expect(
      createInitialOrganizationFromOnboarding(
        {},
        formData({
          organization_name: "Familia Amorim",
          organization_slug: "familia-amorim",
        }),
      ),
    ).resolves.toEqual({
      error: "Muitas tentativas de criacao de organizacao. Tente novamente em alguns minutos.",
    });

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "onboarding.organization.create",
        actorKey: "user-1",
        organizationId: "onboarding",
      }),
    ]);
    expect(mockState.rpcCalls).toHaveLength(0);
  });

  it("uses a shared missing-session bucket before the RPC when claims are absent", async () => {
    const { createInitialOrganizationFromOnboarding } = await import("@/app/onboarding/organizacao/actions");
    mockState.claimsUserId = null;

    await createInitialOrganizationFromOnboarding(
      {},
      formData({
        organization_name: "Familia Amorim",
        organization_slug: "familia-amorim",
      }),
    );

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "onboarding.organization.create",
        actorKey: "missing-session",
        organizationId: "onboarding",
      }),
    ]);
  });

  it("does not consume onboarding rate limit for invalid organization names", async () => {
    const { createInitialOrganizationFromOnboarding } = await import("@/app/onboarding/organizacao/actions");

    await expect(
      createInitialOrganizationFromOnboarding(
        {},
        formData({
          organization_name: "",
          organization_slug: "familia-amorim",
        }),
      ),
    ).resolves.toEqual({ error: "Informe o nome da organiza\u00e7\u00e3o." });

    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(mockState.rpcCalls).toHaveLength(0);
  });
});
