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
    owner_auth_user_id: "org-owner-1",
  },
  movementLookup: {
    id: "movement-1",
    movement_type: "payable_bill_payment",
    direction: "outflow",
    family_member_id: "member-1",
    payable_bill_id: "bill-1",
    receivable_income_id: null,
    reversed_at: null,
  } as Record<string, unknown> | null,
  rpcCalls: [] as Array<{ name: string; payload: Record<string, unknown> }>,
  auditEvents: [] as Array<Record<string, unknown>>,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  rateLimitAllowed: true,
  rpcError: null as { message: string } | null,
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
      if (table === "financial_movements") {
        return Promise.resolve({ data: mockState.movementLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    rpc(name: string, payload: Record<string, unknown>) {
      if (name === "record_audit_event") {
        mockState.auditEvents.push(payload);
        return Promise.resolve({ error: null });
      }

      if (name === "reverse_financial_movement") {
        mockState.rpcCalls.push({ name, payload });
        return Promise.resolve({ error: mockState.rpcError });
      }

      throw new Error(`Unexpected rpc: ${name}`);
    },
    from(table: string) {
      if (table !== "financial_movements") {
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

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 4, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

describe("movement reversal actions", () => {
  beforeEach(() => {
    mockState.movementLookup = {
      id: "movement-1",
      movement_type: "payable_bill_payment",
      direction: "outflow",
      family_member_id: "member-1",
      payable_bill_id: "bill-1",
      receivable_income_id: null,
      reversed_at: null,
    };
    mockState.rpcCalls = [];
    mockState.auditEvents = [];
    mockState.rateLimitChecks = [];
    mockState.rateLimitAllowed = true;
    mockState.rpcError = null;
  });

  it("reverses an eligible financial movement through the atomic rpc", async () => {
    const { reverseFinancialMovement } = await import("@/app/protected/movimentacoes/actions");

    const result = await reverseFinancialMovement({}, createFormData({
      id: "movement-1",
      reason: "Lancamento errado",
    }));

    expect(result).toEqual({ success: "Movimentacao estornada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.movement.reverse",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "movement-1",
      }),
    ]);
    expect(mockState.rpcCalls).toEqual([
      {
        name: "reverse_financial_movement",
        payload: {
          target_organization_id: "org-1",
          target_financial_movement_id: "movement-1",
          target_profile_id: "profile-1",
          target_reversal_reason: "Lancamento errado",
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.movement.reverse",
        p_target_type: "financial_movement",
        p_target_id: "movement-1",
        p_outcome: "success",
        p_metadata: expect.objectContaining({
          movement_reversed: true,
          movement_type: "payable_bill_payment",
          payable_bill_id: "bill-1",
        }),
      }),
    ]);
  });

  it("does not call the rpc when the movement is already reversed", async () => {
    const { reverseFinancialMovement } = await import("@/app/protected/movimentacoes/actions");
    mockState.movementLookup = {
      ...mockState.movementLookup,
      reversed_at: "2026-06-18T00:00:00.000Z",
    } as Record<string, unknown>;

    const result = await reverseFinancialMovement({}, createFormData({
      id: "movement-1",
    }));

    expect(result).toEqual({ error: "Movimentacao ja estornada." });
    expect(mockState.rpcCalls).toHaveLength(0);
    expect(mockState.rateLimitChecks).toHaveLength(0);
  });

  it("audits denied reversals when the rate limit blocks the action", async () => {
    const { reverseFinancialMovement } = await import("@/app/protected/movimentacoes/actions");
    mockState.rateLimitAllowed = false;

    const result = await reverseFinancialMovement({}, createFormData({
      id: "movement-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de estorno. Tente novamente em alguns minutos.",
    });
    expect(mockState.rpcCalls).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.movement.reverse",
        p_target_id: "movement-1",
        p_outcome: "denied",
        p_metadata: expect.objectContaining({
          status: "rate_limited",
          movement_type: "payable_bill_payment",
        }),
      }),
    ]);
  });
});
