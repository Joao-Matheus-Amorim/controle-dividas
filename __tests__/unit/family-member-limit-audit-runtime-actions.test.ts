import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  currentOrganization: {
    id: "org-1",
    slug: "amorim",
  },
  claims: {
    sub: "owner-1",
  },
  currentProfile: {
    id: "profile-1",
    owner_id: "owner-1",
    role: "admin",
  },
  memberLookup: {
    id: "member-1",
    name: "Maria",
    role: "Mae",
    monthly_limit: 500,
  } as Record<string, unknown> | null,
  updatedRows: [] as Array<{ table: string; payload: Record<string, unknown>; filters: Record<string, unknown> }>,
  mutationCount: 1 as number | null,
  mutationError: null as { message: string } | null,
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
  let updatePayload: Record<string, unknown> | null = null;

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
    auth: {
      getClaims: vi.fn(async () => ({
        data: { claims: mockState.claims },
        error: null,
      })),
    },
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

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
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
  requireOrganizationAdmin: vi.fn(async () => ({
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

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 9, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

describe("family member limit audit runtime actions", () => {
  beforeEach(() => {
    mockState.memberLookup = {
      id: "member-1",
      name: "Maria",
      role: "Mae",
      monthly_limit: 500,
    };
    mockState.updatedRows = [];
    mockState.mutationCount = 1;
    mockState.mutationError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("records member limit audit event after an exact organization-scoped update", async () => {
    const { updateFamilyMemberLimit } = await import("@/app/protected/configuracoes/actions");

    const result = await updateFamilyMemberLimit(createFormData({
      id: "member-1",
      monthly_limit: "750",
    }));

    expect(result).toEqual({ success: "Limite atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.member.limit.update",
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
          monthly_limit: 750,
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
        p_action: "finance.member.limit.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "success",
        p_metadata: {
          limit_changed: true,
        },
      }),
    ]);
  });

  it("skips rate limiting and audit when the member limit is unchanged", async () => {
    const { updateFamilyMemberLimit } = await import("@/app/protected/configuracoes/actions");

    const result = await updateFamilyMemberLimit(createFormData({
      id: "member-1",
      monthly_limit: "500",
    }));

    expect(result).toEqual({ success: "Limite atualizado com sucesso." });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not update member limit when the rate limit blocks the action", async () => {
    const { updateFamilyMemberLimit } = await import("@/app/protected/configuracoes/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateFamilyMemberLimit(createFormData({
      id: "member-1",
      monthly_limit: "750",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de limite. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
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

  it("does not record member limit audit event when no row was updated", async () => {
    const { updateFamilyMemberLimit } = await import("@/app/protected/configuracoes/actions");
    mockState.mutationCount = 0;

    const result = await updateFamilyMemberLimit(createFormData({
      id: "member-1",
      monthly_limit: "750",
    }));

    expect(result).toEqual({ error: "Pessoa nao encontrada." });
    expect(mockState.updatedRows).toHaveLength(1);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("records member limit audit event from the full people edit form", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria",
      role: "Mae",
      monthly_limit: "750",
    }));

    expect(result).toEqual({ success: "Pessoa atualizada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.member.limit.update",
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
          name: "Maria",
          role: "Mae",
          monthly_limit: 750,
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
        p_action: "finance.member.limit.update",
        p_target_type: "family_member",
        p_target_id: "member-1",
        p_outcome: "success",
        p_metadata: {
          limit_changed: true,
        },
      }),
    ]);
  });

  it("skips member limit rate limiting and audit when the full people edit keeps the limit unchanged", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria",
      role: "Mae",
      monthly_limit: "500",
    }));

    expect(result).toEqual({ success: "Pessoa atualizada com sucesso." });
    expect(mockState.updatedRows).toHaveLength(1);
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not update people form member data when a changed limit is rate limited", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria",
      role: "Mae",
      monthly_limit: "750",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de limite. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
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
