import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockState = vi.hoisted(() => ({
  adminProfile: {
    id: "admin-profile-1",
    owner_id: "owner-1",
    organization_id: "org-1",
    auth_user_id: "auth-admin-1",
    linked_family_member_id: null,
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    is_active: true,
    created_at: "2026-06-08T00:00:00.000Z",
  },
  currentOrganization: {
    id: "org-1",
    slug: "amorim",
  },
  invitationLookup: {
    id: "invitation-1",
    invited_email_normalized: "ada@example.com",
    status: "pending",
  } as Record<string, unknown> | null,
  insertPayloads: [] as Array<Record<string, unknown>>,
  updatePayloads: [] as Array<Record<string, unknown>>,
  insertError: null as { message: string } | null,
  updateError: null as { message: string } | null,
  updateReturnsRow: true,
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  auditEvents: [] as Array<Record<string, unknown>>,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function makeInvitationQuery() {
  const filters: Record<string, unknown> = {};
  let insertPayload: Record<string, unknown> | null = null;
  let updatePayload: Record<string, unknown> | null = null;

  const query = {
    insert(payload: Record<string, unknown>) {
      insertPayload = payload;
      mockState.insertPayloads.push(payload);
      return query;
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload;
      mockState.updatePayloads.push(payload);
      return query;
    },
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;
      return query;
    },
    maybeSingle() {
      if (updatePayload) {
        return Promise.resolve({
          data: mockState.updateReturnsRow ? { id: filters.id, status: updatePayload.status } : null,
          error: mockState.updateError,
        });
      }

      return Promise.resolve({ data: mockState.invitationLookup, error: null });
    },
    single() {
      if (insertPayload) {
        return Promise.resolve({
          data: { id: "invitation-1" },
          error: mockState.insertError,
        });
      }

      return Promise.resolve({ data: null, error: null });
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    from(table: string) {
      if (table !== "organization_invitations") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeInvitationQuery();
    },
  };
}

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => makeSupabaseClient()),
}));

vi.mock("@/lib/finance/admin-server", () => ({
  ensureAdminProfile: vi.fn(async () => mockState.adminProfile),
}));

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAdmin: vi.fn(async () => ({
    organization: mockState.currentOrganization,
    membership: {
      auth_user_id: "auth-admin-1",
      role: "owner",
      is_active: true,
    },
  })),
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 4, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

vi.mock("@/lib/audit/events", () => ({
  recordAuditEvent: vi.fn(async (payload: Record<string, unknown>) => {
    mockState.auditEvents.push(payload);
  }),
}));

describe("admin invitation runtime actions", () => {
  beforeEach(() => {
    mockState.invitationLookup = {
      id: "invitation-1",
      invited_email_normalized: "ada@example.com",
      status: "pending",
    };
    mockState.insertPayloads = [];
    mockState.updatePayloads = [];
    mockState.insertError = null;
    mockState.updateError = null;
    mockState.updateReturnsRow = true;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
    delete process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY;
    delete process.env.ADMIN_INVITATION_EMAIL_WEBHOOK_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("creates a pending admin invitation with normalized email, token hash, rate limit, and redacted audit", async () => {
    const { createAdminInvitation } = await import("@/app/protected/admin/invitation-actions");

    const result = await createAdminInvitation({}, createFormData({
      email: " Ada@Example.COM ",
    }));

    expect(result).toEqual({ success: "Convite admin preparado com sucesso." });
    expect(mockState.insertPayloads).toEqual([
      expect.objectContaining({
        organization_id: "org-1",
        invited_email_normalized: "ada@example.com",
        invited_by_auth_user_id: "auth-admin-1",
        role: "admin",
        status: "pending",
      }),
    ]);
    expect(String(mockState.insertPayloads[0].token_hash)).toMatch(/^[a-f0-9]{64}$/);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.invitation.create",
        actorKey: "auth-admin-1",
        organizationId: "org-1",
      }),
    ]);
    expect(mockState.rateLimitChecks[0].targetKey).not.toBe("ada@example.com");
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.invitation.create",
        targetType: "organization_invitation",
        targetId: "invitation-1",
        outcome: "success",
        metadata: {
          role: "admin",
          email_domain: "example.com",
          expires_in_days: 7,
          delivery_status: "prepared",
        },
      }),
    ]);
    expect(JSON.stringify(mockState.auditEvents)).not.toContain("ada@example.com");
  });

  it("does not create an invitation when creation is rate limited", async () => {
    const { createAdminInvitation } = await import("@/app/protected/admin/invitation-actions");
    mockState.rateLimitAllowed = false;

    const result = await createAdminInvitation({}, createFormData({
      email: "ada@example.com",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de criacao de convite. Tente novamente em alguns minutos.",
    });
    expect(mockState.insertPayloads).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.invitation.create",
        targetId: null,
        outcome: "denied",
        metadata: {
          status: "rate_limited",
          email_domain: "example.com",
        },
      }),
    ]);
  });

  it("revokes only pending invitations in the active organization", async () => {
    const { revokeAdminInvitation } = await import("@/app/protected/admin/invitation-actions");

    const result = await revokeAdminInvitation(createFormData({
      id: "invitation-1",
    }));

    expect(result).toEqual({ success: "Convite revogado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.invitation.revoke",
        actorKey: "auth-admin-1",
        organizationId: "org-1",
        targetKey: "invitation-1",
      }),
    ]);
    expect(mockState.updatePayloads).toEqual([
      expect.objectContaining({
        status: "revoked",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.invitation.revoke",
        targetId: "invitation-1",
        outcome: "success",
        metadata: {
          email_domain: "example.com",
        },
      }),
    ]);
  });

  it("prepares a resend by rotating the stored credential hash and extending expiry", async () => {
    const { resendAdminInvitation } = await import("@/app/protected/admin/invitation-actions");

    const result = await resendAdminInvitation(createFormData({
      id: "invitation-1",
    }));

    expect(result).toEqual({ success: "Convite preparado para reenvio com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.invitation.resend",
        actorKey: "auth-admin-1",
        organizationId: "org-1",
        targetKey: "invitation-1",
      }),
    ]);
    expect(String(mockState.updatePayloads[0].token_hash)).toMatch(/^[a-f0-9]{64}$/);
    expect(mockState.updatePayloads[0]).toEqual(expect.objectContaining({
      expires_at: expect.any(String),
    }));
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.invitation.resend",
        targetId: "invitation-1",
        outcome: "success",
        metadata: {
          email_domain: "example.com",
          expires_in_days: 7,
          credential_refreshed: true,
          delivery_status: "prepared",
        },
      }),
    ]);
    expect(JSON.stringify(mockState.auditEvents)).not.toContain("token");
  });

  it("revokes a newly created invitation when enabled delivery is not configured", async () => {
    process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY = "true";
    delete process.env.ADMIN_INVITATION_EMAIL_WEBHOOK_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    const { createAdminInvitation } = await import("@/app/protected/admin/invitation-actions");

    const result = await createAdminInvitation({}, createFormData({
      email: "ada@example.com",
    }));

    expect(result).toEqual({
      error: "Nao foi possivel entregar o convite admin. Tente novamente mais tarde.",
    });
    expect(mockState.insertPayloads).toHaveLength(1);
    expect(mockState.updatePayloads).toEqual([
      expect.objectContaining({
        status: "revoked",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.invitation.create",
        targetId: "invitation-1",
        outcome: "failure",
        metadata: {
          status: "delivery_failed",
          delivery_reason: "missing_configuration",
          email_domain: "example.com",
        },
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain("token");
    expect(JSON.stringify(mockState.auditEvents)).not.toContain("ada@example.com");

    delete process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY;
  });

  it("reports compensation failure when delivery failure cannot revoke the pending invitation", async () => {
    process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY = "true";
    delete process.env.ADMIN_INVITATION_EMAIL_WEBHOOK_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    mockState.updateReturnsRow = false;

    const { createAdminInvitation } = await import("@/app/protected/admin/invitation-actions");

    const result = await createAdminInvitation({}, createFormData({
      email: "ada@example.com",
    }));

    expect(result).toEqual({
      error: "Nao foi possivel entregar ou cancelar o convite admin. Acione o suporte.",
    });
    expect(mockState.updatePayloads).toEqual([
      expect.objectContaining({
        status: "revoked",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.invitation.create",
        targetId: "invitation-1",
        outcome: "failure",
        metadata: {
          status: "delivery_compensation_failed",
          delivery_reason: "missing_configuration",
          compensation_reason: "row_not_revoked",
          email_domain: "example.com",
        },
      }),
    ]);
    expect(JSON.stringify(mockState.auditEvents)).not.toContain("ada@example.com");

    delete process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY;
  });
});
