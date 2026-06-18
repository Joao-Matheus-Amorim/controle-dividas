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
  rpcData: { success: true } as Record<string, unknown> | null,
  rpcError: null as { message: string } | null,
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
    rpc(name: string, payload: Record<string, unknown>) {
      if (name === "reverse_financial_movement") {
        mockState.rpcCalls.push({ name, payload });
        return Promise.resolve({ data: mockState.rpcData, error: mockState.rpcError });
      }

      throw new Error(`Unexpected rpc: ${name}`);
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
    mockState.rpcData = { success: true };
    mockState.rpcError = null;
  });

  it("reverses an eligible financial movement through the atomic rpc", async () => {
    const { reverseFinancialMovement } = await import("@/app/protected/movimentacoes/actions");

    const result = await reverseFinancialMovement({}, createFormData({
      id: "movement-1",
      reason: "Lancamento errado",
    }));

    expect(result).toEqual({ success: "Movimentacao estornada com sucesso." });
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
  });

  it("returns rpc validation errors from the database boundary", async () => {
    const { reverseFinancialMovement } = await import("@/app/protected/movimentacoes/actions");
    mockState.rpcData = {
      success: false,
      error: "Movimentacao ja estornada.",
    };

    const result = await reverseFinancialMovement({}, createFormData({
      id: "movement-1",
    }));

    expect(result).toEqual({ error: "Movimentacao ja estornada." });
    expect(mockState.rpcCalls).toHaveLength(1);
  });

  it("returns database-enforced rate limit errors from direct rpc controls", async () => {
    const { reverseFinancialMovement } = await import("@/app/protected/movimentacoes/actions");
    mockState.rpcData = {
      success: false,
      error: "Muitas tentativas de estorno. Tente novamente em alguns minutos.",
    };

    const result = await reverseFinancialMovement({}, createFormData({
      id: "movement-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de estorno. Tente novamente em alguns minutos.",
    });
    expect(mockState.rpcCalls).toHaveLength(1);
  });
});
