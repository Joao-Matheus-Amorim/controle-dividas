import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  adminProfile: {
    id: "admin-profile-1",
    owner_id: "owner-1",
    role: "admin",
    is_active: true,
  },
  currentOrganization: {
    id: "org-1",
    slug: "amorim",
    owner_auth_user_id: "org-owner-1",
  },
  profileLookup: {
    id: "profile-1",
    role: "user",
    is_active: true,
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  profileLookupError: null as { message: string } | null,
  updatedPayloads: [] as Array<Record<string, unknown>>,
  deletedIds: [] as string[],
  updateError: null as { message: string } | null,
  deleteError: null as { message: string } | null,
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  recordAuditEvent: vi.fn(async () => true),
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function lastUpdatePayload() {
  return mockState.updatedPayloads.at(-1);
}

function makeProfilesQuery() {
  const filters: Record<string, unknown> = {};
  let updatePayload: Record<string, unknown> | null = null;
  let deleteMode = false;

  const finishWriteIfReady = () => {
    if (!filters.organization_id) {
      return query;
    }

    if (updatePayload) {
      mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });
      return Promise.resolve({ error: mockState.updateError });
    }

    if (deleteMode) {
      return Promise.resolve({ error: mockState.deleteError });
    }

    return query;
  };

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (deleteMode && key === "id") {
        mockState.deletedIds.push(String(value));
      }

      return finishWriteIfReady();
    },
    or(expression: string) {
      filters.or = expression;

      if (updatePayload) {
        mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });
        return Promise.resolve({ error: mockState.updateError });
      }

      if (deleteMode) {
        return Promise.resolve({ error: mockState.deleteError });
      }

      return query;
    },
    ilike(key: string, value: unknown) {
      filters[key] = value;
      return query;
    },
    maybeSingle() {
      if (filters.id === "member-1") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      return Promise.resolve({ data: mockState.profileLookup, error: mockState.profileLookupError });
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload;
      return query;
    },
    delete() {
      deleteMode = true;
      return query;
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    from(table: string) {
      if (!["profiles", "family_members"].includes(table)) {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeProfilesQuery();
    },
  };
}

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => makeSupabaseClient()),
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

vi.mock("@/lib/finance/admin-server", () => ({
  ensureAdminProfile: vi.fn(async () => mockState.adminProfile),
}));

vi.mock("@/lib/audit/events", () => ({
  recordAuditEvent: mockState.recordAuditEvent,
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 4, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

vi.mock("@/lib/finance/permissions", () => ({
  FINANCE_MODULES: [
    { key: "DASHBOARD" },
    { key: "GASTOS" },
  ],
}));

describe("admin family user actions", () => {
  beforeEach(() => {
    mockState.profileLookup = {
      id: "profile-1",
      role: "user",
      is_active: true,
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.profileLookupError = null;
    mockState.updatedPayloads = [];
    mockState.deletedIds = [];
    mockState.updateError = null;
    mockState.deleteError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.recordAuditEvent.mockClear();
  });

  it("returns explicit validation error when updating without email", async () => {
    const { updateFamilyUser } = await import("@/app/protected/admin/actions");

    const result = await updateFamilyUser(createFormData({
      id: "profile-1",
      name: "Maria",
      linked_family_member_id: "member-1",
    }));

    expect(result).toEqual({ error: "Informe o email de acesso." });
    expect(mockState.updatedPayloads).toHaveLength(0);
  });

  it("blocks updates when the admin user rate limit is exceeded", async () => {
    const { updateFamilyUser } = await import("@/app/protected/admin/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateFamilyUser(createFormData({
      id: "profile-1",
      name: "Maria",
      email: "maria@example.com",
      linked_family_member_id: "member-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de acesso familiar. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.user.update",
        actorKey: "admin-profile-1",
        organizationId: "org-1",
        targetKey: "profile-1",
      }),
    ]);
    expect(mockState.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      action: "admin.user.update",
      targetType: "profile",
      targetId: "profile-1",
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    }));
  });

  it("blocks status changes for admin profiles with an explicit error", async () => {
    const { toggleFamilyUserStatus } = await import("@/app/protected/admin/actions");
    mockState.profileLookup = {
      id: "admin-profile-1",
      role: "admin",
      is_active: true,
    };

    const result = await toggleFamilyUserStatus(createFormData({
      id: "admin-profile-1",
      is_active: "true",
    }));

    expect(result).toEqual({ error: "Nao e possivel alterar o status do Admin familiar." });
    expect(mockState.updatedPayloads).toHaveLength(0);
  });

  it("returns Supabase status update errors instead of swallowing them", async () => {
    const { toggleFamilyUserStatus } = await import("@/app/protected/admin/actions");
    mockState.updateError = { message: "database status update failed" };

    const result = await toggleFamilyUserStatus(createFormData({
      id: "profile-1",
      is_active: "true",
    }));

    expect(result).toEqual({ error: "database status update failed" });
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      is_active: false,
      organization_id: "org-1",
      filters: expect.objectContaining({
        id: "profile-1",
        organization_id: "org-1",
      }),
    }));
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.user.status.update",
        actorKey: "admin-profile-1",
        organizationId: "org-1",
        targetKey: "profile-1",
      }),
    ]);
  });

  it("updates family user status successfully", async () => {
    const { toggleFamilyUserStatus } = await import("@/app/protected/admin/actions");

    const result = await toggleFamilyUserStatus(createFormData({
      id: "profile-1",
      is_active: "true",
    }));

    expect(result).toEqual({ success: "Acesso familiar desativado com sucesso." });
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      is_active: false,
      organization_id: "org-1",
      filters: expect.objectContaining({
        id: "profile-1",
        organization_id: "org-1",
      }),
    }));
  });

  it("blocks stale status forms before updating or recording audit events", async () => {
    const { toggleFamilyUserStatus } = await import("@/app/protected/admin/actions");
    mockState.profileLookup = {
      id: "profile-1",
      role: "user",
      is_active: false,
    };

    const result = await toggleFamilyUserStatus(createFormData({
      id: "profile-1",
      is_active: "true",
    }));

    expect(result).toEqual({ error: "O status deste acesso mudou. Atualize a pagina e tente novamente." });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.recordAuditEvent).not.toHaveBeenCalled();
  });

  it("blocks status changes when the admin user rate limit is exceeded", async () => {
    const { toggleFamilyUserStatus } = await import("@/app/protected/admin/actions");
    mockState.rateLimitAllowed = false;

    const result = await toggleFamilyUserStatus(createFormData({
      id: "profile-1",
      is_active: "true",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.user.status.update",
        actorKey: "admin-profile-1",
        organizationId: "org-1",
        targetKey: "profile-1",
      }),
    ]);
    expect(mockState.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      action: "admin.user.deactivate",
      targetType: "profile",
      targetId: "profile-1",
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    }));
  });

  it("derives status update and audit event from persisted profile state", async () => {
    const { toggleFamilyUserStatus } = await import("@/app/protected/admin/actions");
    mockState.profileLookup = {
      id: "profile-1",
      role: "user",
      is_active: true,
    };

    const result = await toggleFamilyUserStatus(createFormData({
      id: "profile-1",
      is_active: "true",
    }));

    expect(result).toEqual({ success: "Acesso familiar desativado com sucesso." });
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      is_active: false,
      organization_id: "org-1",
    }));
    expect(mockState.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      action: "admin.user.deactivate",
      targetType: "profile",
      targetId: "profile-1",
      outcome: "success",
      metadata: {
        previous_active: true,
        next_active: false,
      },
    }));
  });

  it("returns Supabase delete errors instead of swallowing them", async () => {
    const { deleteFamilyUser } = await import("@/app/protected/admin/actions");
    mockState.deleteError = { message: "database delete failed" };

    const result = await deleteFamilyUser(createFormData({
      id: "profile-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({ error: "database delete failed" });
    expect(mockState.deletedIds).toEqual(["profile-1"]);
  });

  it("blocks deletes when the admin user rate limit is exceeded", async () => {
    const { deleteFamilyUser } = await import("@/app/protected/admin/actions");
    mockState.rateLimitAllowed = false;

    const result = await deleteFamilyUser(createFormData({
      id: "profile-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de exclusao de acesso familiar. Tente novamente em alguns minutos.",
    });
    expect(mockState.deletedIds).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "admin.user.delete",
        actorKey: "admin-profile-1",
        organizationId: "org-1",
      }),
    ]);
    expect(mockState.rateLimitChecks[0]).not.toHaveProperty("targetKey");
    expect(mockState.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      action: "admin.user.delete",
      targetType: "profile",
      targetId: "profile-1",
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    }));
  });

  it("deletes family user successfully", async () => {
    const { deleteFamilyUser } = await import("@/app/protected/admin/actions");

    const result = await deleteFamilyUser(createFormData({
      id: "profile-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({ success: "Acesso familiar excluido com sucesso." });
    expect(mockState.deletedIds).toEqual(["profile-1"]);
  });
});
