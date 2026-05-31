import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  portalCalls: [] as Array<Record<string, unknown>>,
  portalResult: {
    ok: true,
    url: "https://billing.stripe.test/session",
  } as
    | { ok: true; url: string }
    | {
        ok: false;
        reason:
          | "portal_disabled"
          | "stripe_not_configured"
          | "missing_customer"
          | "missing_portal_url";
      },
  auditEvents: [] as Array<Record<string, unknown>>,
  redirects: [] as string[],
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    mockState.redirects.push(url);
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAdmin: vi.fn(async (orgSlug?: string) => ({
    organization: {
      id: "org-1",
      slug: orgSlug ?? "familia-amorim",
      name: "Familia Amorim",
      owner_auth_user_id: "owner-1",
      plan: "family_plus",
      status: "active",
      trial_ends_at: null,
      stripe_customer_id: "cus_123",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    membership: {
      id: "membership-1",
      organization_id: "org-1",
      auth_user_id: "user-1",
      role: "owner",
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
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

vi.mock("@/lib/billing/stripe-portal", () => ({
  createStripeBillingPortalSession: vi.fn(async (input: Record<string, unknown>) => {
    mockState.portalCalls.push(input);

    return mockState.portalResult;
  }),
}));

vi.mock("@/lib/audit/events", () => ({
  recordAuditEvent: vi.fn(async (input: Record<string, unknown>) => {
    mockState.auditEvents.push(input);

    return true;
  }),
}));

describe("billing portal runtime actions", () => {
  beforeEach(() => {
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.portalCalls = [];
    mockState.portalResult = {
      ok: true,
      url: "https://billing.stripe.test/session",
    };
    mockState.auditEvents = [];
    mockState.redirects = [];
    vi.resetModules();
  });

  it("rate limits and opens billing portal from server-resolved organization context", async () => {
    const { startBillingPortal } = await import(
      "@/app/protected/configuracoes/billing-actions"
    );

    await expect(startBillingPortal("familia-amorim")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "billing.portal.start",
        actorKey: "user-1",
        organizationId: "org-1",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      }),
    ]);
    expect(mockState.portalCalls).toEqual([
      expect.objectContaining({
        orgSlug: "familia-amorim",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        organizationId: "org-1",
        action: "billing.portal.start",
        targetType: "billing_portal",
        outcome: "success",
      }),
    ]);
    expect(mockState.redirects).toEqual(["https://billing.stripe.test/session"]);
  });

  it("does not call Stripe portal when rate limit denies", async () => {
    const { startBillingPortal } = await import(
      "@/app/protected/configuracoes/billing-actions"
    );
    mockState.rateLimitAllowed = false;

    await expect(startBillingPortal()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockState.portalCalls).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "billing.portal.failed",
        outcome: "denied",
        metadata: {
          status: "rate_limited",
        },
      }),
    ]);
    expect(mockState.redirects).toEqual([
      "/protected/configuracoes?billing_portal=rate_limited",
    ]);
  });

  it("redirects safely when Stripe portal cannot create a session", async () => {
    const { startBillingPortal } = await import(
      "@/app/protected/configuracoes/billing-actions"
    );
    mockState.portalResult = {
      ok: false,
      reason: "missing_customer",
    };

    await expect(startBillingPortal("familia-amorim")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "billing.portal.failed",
        outcome: "failure",
        metadata: {
          status: "missing_customer",
        },
      }),
    ]);
    expect(mockState.redirects).toEqual([
      "/org/familia-amorim/configuracoes?billing_portal=missing_customer",
    ]);
  });
});
