import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  currentProfile: {
    id: "profile-1",
    owner_id: "owner-1",
    role: "admin",
  },
  currentOrganization: {
    id: "org-1",
    slug: "amorim",
  },
  memberLookup: {
    id: "member-1",
    name: "Maria",
    role: "Mae",
    monthly_limit: 500,
  } as Record<string, unknown> | null,
  insertedMember: {
    id: "member-new",
  } as Record<string, unknown> | null,
  insertedRows: [] as Array<{ table: string; payload: Record<string, unknown> }>,
  updatedRows: [] as Array<{ table: string; payload: Record<string, unknown>; filters: Record<string, unknown> }>,
  mutationCount: 1 as number | null,
  mutationError: null as { message: string } | null,
  rateLimitAllowed: true,
  rateLimitAllowedByOperation: {} as Record<string, boolean>,
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
  let updatePayload: Record<string, unknown> | null = null;
  let insertPayload: Record<string, unknown> | null = null;

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (updatePayload && key === "organization_id") {
        mockState.updatedRows.push({ table, payload: updatePayload, filters: { ...filters } });
        return Promise.resolve({ error: mockState.mutationError, count: mockState.mutationCount });
      }

      return query;
    },
    maybeSingle() {
      return Promise.resolve({ data: mockState.memberLookup, error: null });
    },
    single() {
      return Promise.resolve({ data: mockState.insertedMember, error: mockState.mutationError });
    },
    insert(payload: Record<string, unknown>) {
      insertPayload = payload;
      mockState.insertedRows.push({ table, payload: insertPayload });
      return query;
    },
    update(payload: Record<string, unknown>, options?: Record<string, unknown>) {
      if (options?.count !== "exact") {
        throw new Error("Expected exact update count");
      }

      updatePayload = payload;
      return query;
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    rpc(name: string, payload: Record<string, unknown>) {
      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (table !== "family_members") {
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

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAccess: vi.fn(async () => ({
    organization: mockState.currentOrganization,
    membership: {
      role: "owner",
      is_active: true,
    },
  })),
}));

vi.mock("@/lib/finance/access-control", () => ({
  getCurrentProfile: vi.fn(async () => mockState.currentProfile),
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);
    const operationKey = String(input.operationKey);
    const allowed = operationKey in mockState.rateLimitAllowedByOperation
      ? mockState.rateLimitAllowedByOperation[operationKey]
      : mockState.rateLimitAllowed;

    return allowed
      ? { allowed: true, remaining: 9, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

describe("family member write audit runtime actions", () => {
  beforeEach(() => {
    mockState.memberLookup = {
      id: "member-1",
      name: "Maria",
      role: "Mae",
      monthly_limit: 500,
    };
    mockState.insertedMember = {
      id: "member-new",
    };
    mockState.insertedRows = [];
    mockState.updatedRows = [];
    mockState.mutationCount = 1;
    mockState.mutationError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitAllowedByOperation = {};
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("records member create audit event after a rate-limited organization-scoped insert", async () => {
    const { createFamilyMember } = await import("@/app/protected/pessoas/actions");

    const result = await createFamilyMember({} as never, createFormData({
      name: "Joao",
      role: "Filho",
      monthly_limit: "300",
    }));

    expect(result).toEqual({ success: "Pessoa cadastrada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.member.create",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.insertedRows).toEqual([
      {
        table: "family_members",
        payload: {
          owner_id: "owner-1",
          organization_id: "org-1",
          name: "Joao",
          role: "Filho",
          monthly_limit: 300,
          currency: "EUR",
          is_active: true,
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.member.create",
        p_target_type: "family_member",
        p_target_id: "member-new",
        p_outcome: "success",
        p_metadata: {
          member_created: true,
        },
      }),
    ]);
  });

  it("does not create a member when create rate limit blocks the action", async () => {
    const { createFamilyMember } = await import("@/app/protected/pessoas/actions");
    mockState.rateLimitAllowed = false;

    const result = await createFamilyMember({} as never, createFormData({
      name: "Joao",
      role: "Filho",
      monthly_limit: "300",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de cadastro de pessoa. Tente novamente em alguns minutos.",
    });
    expect(mockState.insertedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.member.create",
        p_target_type: "family_member",
        p_target_id: null,
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          member_created: true,
        },
      }),
    ]);
  });

  it("records member update audit event when name or role changes", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria Silva",
      role: "Responsavel",
      monthly_limit: "500",
    }));

    expect(result).toEqual({ success: "Pessoa atualizada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.member.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
      },
    ]);
    expect(mockState.updatedRows).toEqual([
      {
        table: "family_members",
        payload: {
          name: "Maria Silva",
          role: "Responsavel",
          monthly_limit: 500,
          organization_id: "org-1",
        },
        filters: {
          id: "member-1",
          owner_id: "owner-1",
          organization_id: "org-1",
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.member.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "success",
        p_metadata: {
          member_profile_changed: true,
        },
      }),
    ]);
  });

  it("skips member update audit when only the monthly limit changes", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria",
      role: "Mae",
      monthly_limit: "750",
    }));

    expect(result).toEqual({ success: "Pessoa atualizada com sucesso." });
    expect(mockState.rateLimitChecks.map((item) => item.operationKey)).toEqual([
      "finance.member.limit.update",
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.member.limit.update",
        p_metadata: {
          limit_changed: true,
        },
      }),
    ]);
  });

  it("preflights and consumes paired limits when member profile and limit both change", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria Silva",
      role: "Responsavel",
      monthly_limit: "750",
    }));

    expect(result).toEqual({ success: "Pessoa atualizada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.member.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
        consume: false,
      },
      {
        operationKey: "finance.member.limit.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
        consume: false,
      },
      {
        operationKey: "finance.member.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
      },
      {
        operationKey: "finance.member.limit.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.member.limit.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "success",
        p_metadata: {
          limit_changed: true,
        },
      }),
      expect.objectContaining({
        p_action: "finance.member.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "success",
        p_metadata: {
          member_profile_changed: true,
        },
      }),
    ]);
  });

  it("does not update member profile data when the member update rate limit blocks the action", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria Silva",
      role: "Responsavel",
      monthly_limit: "500",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de pessoa. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.member.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          member_profile_changed: true,
        },
      }),
    ]);
  });

  it("does not consume limit quota when paired member update limit blocks before mutation", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.member.update": false,
      "finance.member.limit.update": true,
    };

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria Silva",
      role: "Responsavel",
      monthly_limit: "750",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de pessoa. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.member.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.member.limit.update",
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.member.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          member_profile_changed: true,
        },
      }),
    ]);
  });

  it("does not consume member update quota when paired limit update blocks before mutation", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.member.update": true,
      "finance.member.limit.update": false,
    };

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria Silva",
      role: "Responsavel",
      monthly_limit: "750",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de limite. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.member.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
        consume: false,
      }),
      expect.objectContaining({
        operationKey: "finance.member.limit.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "member-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.member.update" && check.consume !== false,
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.member.limit.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          limit_changed: true,
        },
      }),
    ]);
  });
});
