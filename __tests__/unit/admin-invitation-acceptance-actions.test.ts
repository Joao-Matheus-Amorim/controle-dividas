import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  claims: {
    sub: "auth-invitee-1",
    email: "ada@example.com",
  } as Record<string, unknown> | null,
  rpcResult: {
    status: "accepted",
    organization_id: "org-1",
    organization_slug: "amorim",
    invitation_id: "invitation-1",
    role: "admin",
    email_domain: "example.com",
    profile_linked: true,
    profile_created: false,
  } as Record<string, unknown>,
  rpcError: null as { message: string } | null,
  rpcCalls: [] as Array<{ name: string; args: Record<string, unknown> }>,
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  auditEvents: [] as Array<Record<string, unknown>>,
  revalidated: [] as Array<{ paths: string[]; slug?: string }>,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function makeSupabaseClient() {
  return {
    auth: {
      getClaims: vi.fn(async () => ({
        data: mockState.claims ? { claims: mockState.claims } : null,
        error: mockState.claims ? null : { message: "unauthenticated" },
      })),
    },
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      mockState.rpcCalls.push({ name, args });

      return {
        data: mockState.rpcResult,
        error: mockState.rpcError,
      };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => makeSupabaseClient()),
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 7, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

vi.mock("@/lib/audit/events", () => ({
  recordAuditEvent: vi.fn(async (payload: Record<string, unknown>) => {
    mockState.auditEvents.push(payload);
  }),
}));

vi.mock("@/lib/organizations/revalidation", () => ({
  revalidateOrganizationPaths: vi.fn((paths: string[], slug?: string) => {
    mockState.revalidated.push({ paths, slug });
  }),
}));

describe("admin invitation acceptance action", () => {
  beforeEach(() => {
    mockState.claims = {
      sub: "auth-invitee-1",
      email: "ada@example.com",
    };
    mockState.rpcResult = {
      status: "accepted",
      organization_id: "org-1",
      organization_slug: "amorim",
      invitation_id: "invitation-1",
      role: "admin",
      email_domain: "example.com",
      profile_linked: true,
      profile_created: false,
    };
    mockState.rpcError = null;
    mockState.rpcCalls = [];
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
    mockState.revalidated = [];
  });

  it("accepts an invitation through the RPC with hashed rate limit key and redacted audit", async () => {
    const { acceptAdminInvitation } = await import("@/app/auth/convite/actions");

    const result = await acceptAdminInvitation({}, createFormData({
      token: " raw-invite-token ",
    }));

    expect(result).toEqual({ success: "Convite aceito com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.invitation.accept",
        actorKey: "auth-invitee-1",
        organizationId: "pending-invitation",
      }),
    ]);
    expect(mockState.rateLimitChecks[0].targetKey).not.toBe("raw-invite-token");
    expect(mockState.rpcCalls).toEqual([
      {
        name: "accept_organization_invitation",
        args: { p_token: "raw-invite-token" },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        organizationId: "org-1",
        action: "admin.invitation.accept",
        targetType: "organization_invitation",
        targetId: "invitation-1",
        outcome: "success",
        metadata: {
          role: "admin",
          email_domain: "example.com",
          profile_linked: true,
          profile_created: false,
        },
      }),
    ]);
    expect(JSON.stringify(mockState.auditEvents)).not.toContain("raw-invite-token");
    expect(JSON.stringify(mockState.auditEvents)).not.toContain("token");
    expect(mockState.revalidated).toEqual([
      {
        paths: ["/protected/admin", "/protected/admin/usuarios"],
        slug: "amorim",
      },
    ]);
  });

  it("does not call the RPC when acceptance is rate limited", async () => {
    const { acceptAdminInvitation } = await import("@/app/auth/convite/actions");
    mockState.rateLimitAllowed = false;

    const result = await acceptAdminInvitation({}, createFormData({
      token: "raw-invite-token",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de aceite de convite. Tente novamente em alguns minutos.",
    });
    expect(mockState.rpcCalls).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("maps expired invitation responses to a generic token error without recording a success audit", async () => {
    const { acceptAdminInvitation } = await import("@/app/auth/convite/actions");
    mockState.rpcResult = {
      status: "expired",
      organization_id: "org-1",
      organization_slug: "amorim",
      invitation_id: "invitation-1",
    };

    const result = await acceptAdminInvitation({}, createFormData({
      token: "raw-invite-token",
    }));

    expect(result).toEqual({ error: "Convite invalido ou ja utilizado." });
    expect(mockState.auditEvents).toHaveLength(0);
    expect(mockState.revalidated).toHaveLength(0);
  });

  it("requires an authenticated user before accepting the invitation", async () => {
    const { acceptAdminInvitation } = await import("@/app/auth/convite/actions");
    mockState.claims = null;

    const result = await acceptAdminInvitation({}, createFormData({
      token: "raw-invite-token",
    }));

    expect(result).toEqual({ error: "Entre na sua conta para aceitar o convite." });
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(mockState.rpcCalls).toHaveLength(0);
  });
});
