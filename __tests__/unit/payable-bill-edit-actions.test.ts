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
  updatedPayloads: [] as Array<Record<string, unknown>>,
  auditEvents: [] as Array<Record<string, unknown>>,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  billLookup: {
    id: "bill-1",
    owner_id: "owner-1",
    responsible_member_id: "member-1",
    name: "Aluguel",
    category: "Casa",
    amount: 850,
    due_date: "2026-05-05",
    status: "pendente",
    bill_type: "fixa",
    bank_used: null,
    recurrence: "mensal",
    notes: null,
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  bankLookup: {
    id: "bank-1",
    organization_id: "org-1",
    family_member_id: "member-1",
    bank_name: "Wise",
  } as Record<string, unknown> | null,
  accessError: null as Error | null,
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

      if (updatePayload) {
        mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });

        if (key === "organization_id") {
          return Promise.resolve({ error: null, count: 1 });
        }
      }

      return query;
    },
    or(expression: string) {
      filters.or = expression;

      if (updatePayload) {
        mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });
      }

      return query;
    },
    maybeSingle() {
      if (table === "payable_bills") {
        return Promise.resolve({ data: mockState.billLookup, error: null });
      }

      if (table === "family_members") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      if (table === "banks") {
        return Promise.resolve({ data: mockState.bankLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    limit(value: number) {
      if (value !== 1) {
        throw new Error("Expected existence lookup limit");
      }

      if (table === "banks") {
        return Promise.resolve({
          data: mockState.bankLookup ? [mockState.bankLookup] : [],
          error: null,
        });
      }

      return Promise.resolve({ data: [], error: null });
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload;
      return query;
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    rpc(name: string, payload: Record<string, unknown>) {
      if (name === "mark_payable_bill_paid_with_movement") {
        mockState.updatedPayloads.push({
          status: "pago",
          organization_id: payload.target_organization_id,
          recorded_timezone: payload.target_recorded_timezone,
          filters: {
            id: payload.target_payable_bill_id,
            organization_id: payload.target_organization_id,
          },
        });

        return Promise.resolve({ error: null });
      }

      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (!["payable_bills", "family_members", "banks"].includes(table)) {
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
  assertCanAccessMember: vi.fn(async () => {
    if (mockState.accessError) {
      throw mockState.accessError;
    }
  }),
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return { allowed: true, remaining: 9, resetAt: 1000 };
  }),
}));

describe("payable bill edit action", () => {
  beforeEach(() => {
    mockState.updatedPayloads = [];
    mockState.auditEvents = [];
    mockState.rateLimitChecks = [];
    mockState.billLookup = {
      id: "bill-1",
      owner_id: "owner-1",
      responsible_member_id: "member-1",
      name: "Aluguel",
      category: "Casa",
      amount: 850,
      due_date: "2026-05-05",
      status: "pendente",
      bill_type: "fixa",
      bank_used: null,
      recurrence: "mensal",
      notes: null,
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.bankLookup = {
      id: "bank-1",
      organization_id: "org-1",
      family_member_id: "member-1",
      bank_name: "Wise",
    };
    mockState.accessError = null;
  });

  it("updates a payable bill with full editable fields", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Aluguel atualizado",
      category: "Casa",
      amount: "900",
      due_date: "2026-06-05",
      responsible_member_id: "member-1",
      status: "pago",
      bill_type: "fixa",
      recurrence: "mensal",
      bank_used: "Wise",
      recorded_timezone: "Europe/Lisbon",
      notes: "Pago antecipado",
    }));

    expect(result).toEqual({ success: "Conta atualizada com sucesso." });
    expect(mockState.updatedPayloads.at(-1)).toEqual(expect.objectContaining({
      status: "pago",
      organization_id: "org-1",
      recorded_timezone: "Europe/Lisbon",
      filters: {
        id: "bill-1",
        organization_id: "org-1",
      },
    }));
  });

  it("blocks update without id", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await updatePayableBill({}, createFormData({
      name: "Internet",
      amount: "120",
      due_date: "2026-05-20",
      responsible_member_id: "member-1",
    }));

    expect(result).toEqual({ error: "Conta nao encontrada." });
    expect(mockState.updatedPayloads).toHaveLength(0);
  });
});
