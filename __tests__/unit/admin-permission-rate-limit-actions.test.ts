import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  adminProfile: {
    id: "admin-profile-1",
    owner_id: "owner-1",
    role: "admin",
  },
  currentOrganization: {
    id: "org-1",
    slug: "amorim",
    owner_auth_user_id: "org-owner-1",
  },
  profileLookup: {
    id: "profile-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  upsertRows: [] as Array<{
    table: string;
    rows: Array<Record<string, unknown>>;
    options: Record<string, unknown>;
  }>,
  upsertError: null as { message: string } | null,
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

function makeQuery(table: string) {
  const filters: Record<string, unknown> = {};

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;
      return query;
    },
    maybeSingle() {
      if (table === "profiles") {
        return Promise.resolve({ data: mockState.profileLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    upsert(rows: Array<Record<string, unknown>>, options: Record<string, unknown>) {
      mockState.upsertRows.push({ table, rows, options });
      return Promise.resolve({ error: mockState.upsertError });
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    from(table: string) {
      if (!["profiles", "user_module_permissions", "user_feature_permissions"].includes(table)) {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeQuery(table);
    },
  };
}

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => makeSupabaseClient()),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/finance/admin-server", () => ({
  ensureAdminProfile: vi.fn(async () => mockState.adminProfile),
}));

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAdmin: vi.fn(async () => ({
    organization: mockState.currentOrganization,
    membership: {
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

vi.mock("@/lib/admin-invitations/delivery", () => ({
  sendAdminInvitationEmail: vi.fn(async () => ({ delivered: true })),
}));

vi.mock("@/lib/finance/permissions", () => ({
  FINANCE_MODULES: [
    { key: "GASTOS", label: "Gastos" },
    { key: "BANCOS", label: "Bancos" },
  ],
  FEATURE_PERMISSIONS: [
    { key: "dashboard", label: "Dashboard" },
    { key: "reports", label: "Relatorios" },
  ],
}));

describe("admin permission rate limit actions", () => {
  beforeEach(() => {
    mockState.profileLookup = {
      id: "profile-1",
      organization_id: "org-1",
    };
    mockState.upsertRows = [];
    mockState.upsertError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("limits module permission updates by server-derived actor and organization", async () => {
    const { saveProfilePermissions } = await import("@/app/protected/admin/actions");

    const result = await saveProfilePermissions({}, createFormData({
      profile_id: "profile-1",
      "GASTOS.can_view": "on",
      "GASTOS.scope": "own",
      "BANCOS.can_view": "on",
      "BANCOS.can_delete": "on",
      "BANCOS.scope": "family",
    }));

    expect(result).toEqual({ success: "Permissoes salvas com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "admin.permission.update",
        limit: 5,
        windowMs: 10 * 60 * 1000,
        actorKey: "admin-profile-1",
        organizationId: "org-1",
        targetKey: "profile-1",
      },
    ]);
    expect(mockState.upsertRows).toEqual([
      expect.objectContaining({
        table: "user_module_permissions",
        options: { onConflict: "profile_id,module" },
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.permission.update",
        targetType: "profile",
        targetId: "profile-1",
        outcome: "success",
        metadata: {
          profile_id: "profile-1",
          changed_count: 2,
        },
      }),
    ]);
  });

  it("does not upsert module permissions when the rate limit blocks the action", async () => {
    const { saveProfilePermissions } = await import("@/app/protected/admin/actions");
    mockState.rateLimitAllowed = false;

    const result = await saveProfilePermissions({}, createFormData({
      profile_id: "profile-1",
      "GASTOS.can_view": "on",
      "GASTOS.scope": "own",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de permissoes. Tente novamente em alguns minutos.",
    });
    expect(mockState.upsertRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.permission.update",
        targetType: "profile",
        targetId: "profile-1",
        outcome: "denied",
        metadata: {
          profile_id: "profile-1",
          changed_count: 0,
          status: "rate_limited",
        },
      }),
    ]);
  });

  it("limits feature permission updates by server-derived actor and organization", async () => {
    const { saveProfileFeaturePermissions } = await import("@/app/protected/admin/actions");

    const result = await saveProfileFeaturePermissions({}, createFormData({
      profile_id: "profile-1",
      "dashboard.is_enabled": "on",
    }));

    expect(result).toEqual({ success: "Funcionalidades salvas com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "admin.feature_permission.update",
        limit: 5,
        windowMs: 10 * 60 * 1000,
        actorKey: "admin-profile-1",
        organizationId: "org-1",
        targetKey: "profile-1",
      },
    ]);
    expect(mockState.upsertRows).toEqual([
      expect.objectContaining({
        table: "user_feature_permissions",
        options: { onConflict: "profile_id,feature_key" },
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.feature_permission.update",
        targetType: "profile",
        targetId: "profile-1",
        outcome: "success",
        metadata: {
          profile_id: "profile-1",
          changed_count: 2,
        },
      }),
    ]);
  });

  it("does not upsert feature permissions when the rate limit blocks the action", async () => {
    const { saveProfileFeaturePermissions } = await import("@/app/protected/admin/actions");
    mockState.rateLimitAllowed = false;

    const result = await saveProfileFeaturePermissions({}, createFormData({
      profile_id: "profile-1",
      "dashboard.is_enabled": "on",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de funcionalidades. Tente novamente em alguns minutos.",
    });
    expect(mockState.upsertRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        action: "admin.feature_permission.update",
        targetType: "profile",
        targetId: "profile-1",
        outcome: "denied",
        metadata: {
          profile_id: "profile-1",
          changed_count: 0,
          status: "rate_limited",
        },
      }),
    ]);
  });
});
