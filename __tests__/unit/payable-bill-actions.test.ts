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
  insertedPayloads: [] as Array<Record<string, unknown>>,
  updatedPayloads: [] as Array<Record<string, unknown>>,
  deletedIds: [] as string[],
  bankLookup: {
    id: "bank-1",
    organization_id: "org-1",
    family_member_id: "member-1",
    currency: "BRL",
  } as Record<string, unknown> | null,
  billLookup: {
    id: "bill-1",
    owner_id: "owner-1",
    responsible_member_id: "member-1",
    name: "Boleto atual",
    category: "Outros",
    amount: 90.5,
    due_date: "2026-05-20",
    status: "pendente",
    bill_type: "avulsa",
    bank_used: null,
    recurrence: null,
    notes: null,
  } as Record<string, unknown> | null,
  insertedBill: {
    id: "bill-new",
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  insertError: null as { message: string } | null,
  mutationCount: 1 as number | null,
  mutationError: null as { message: string } | null,
  deleteCount: 1 as number | null,
  deleteError: null as { code?: string; message: string; details?: string } | null,
  accessError: null as Error | null,
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

function lastUpdatePayload() {
  return mockState.updatedPayloads.at(-1);
}

function makeQuery(table: string) {
  const filters: Record<string, unknown> = {};
  let updatePayload: Record<string, unknown> | null = null;
  let deleteMode = false;

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (updatePayload) {
        mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });

        if (key === "organization_id") {
          return Promise.resolve({
            error: mockState.mutationError,
            count: mockState.mutationCount,
          });
        }
      }

      if (deleteMode && key === "id") {
        mockState.deletedIds.push(String(value));
      }

      if (deleteMode && key === "organization_id") {
        return Promise.resolve({ error: mockState.deleteError, count: mockState.deleteCount });
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
    single() {
      return Promise.resolve({ data: mockState.insertedBill, error: mockState.insertError });
    },
    insert(payload: Record<string, unknown>) {
      mockState.insertedPayloads.push(payload);
      return query;
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload;
      return query;
    },
    delete(options?: Record<string, unknown>) {
      if (options?.count !== "exact") {
        throw new Error("Expected exact delete count");
      }

      deleteMode = true;
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
          filters: {
            id: payload.target_payable_bill_id,
            organization_id: payload.target_organization_id,
          },
        });

        return Promise.resolve({ error: mockState.mutationError });
      }

      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (!["payable_bills", "family_members", "banks", "financial_movements"].includes(table)) {
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
    const operationKey = String(input.operationKey);
    const allowed = operationKey in mockState.rateLimitAllowedByOperation
      ? mockState.rateLimitAllowedByOperation[operationKey]
      : mockState.rateLimitAllowed;

    return allowed
      ? { allowed: true, remaining: 4, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

describe("payable bill actions", () => {
  beforeEach(() => {
    mockState.insertedPayloads = [];
    mockState.updatedPayloads = [];
    mockState.deletedIds = [];
    mockState.bankLookup = {
      id: "bank-1",
      organization_id: "org-1",
      family_member_id: "member-1",
      currency: "BRL",
    };
    mockState.billLookup = {
      id: "bill-1",
      owner_id: "owner-1",
      responsible_member_id: "member-1",
      name: "Boleto atual",
      category: "Outros",
      amount: 90.5,
      due_date: "2026-05-20",
      status: "pendente",
      bill_type: "avulsa",
      bank_used: null,
      recurrence: null,
      notes: null,
    };
    mockState.insertedBill = {
      id: "bill-new",
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.insertError = null;
    mockState.mutationCount = 1;
    mockState.mutationError = null;
    mockState.deleteCount = 1;
    mockState.deleteError = null;
    mockState.accessError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitAllowedByOperation = {};
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("blocks payable bill creation without responsible member", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Internet",
      amount: "120",
      due_date: "2026-05-20",
    }));

    expect(result).toEqual({ error: "Selecione o responsavel pela conta." });
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("blocks payable bill creation with invalid amount", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Internet",
      amount: "0",
      due_date: "2026-05-20",
      responsible_member_id: "member-1",
    }));

    expect(result).toEqual({ error: "Informe um valor valido." });
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("creates one-off payable bill as avulsa without recurrence", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Boleto eventual",
      category: "Outros",
      amount: "90.50",
      due_date: "2026-05-20",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "avulsa",
      recurrence: "mensal",
    }));

    expect(result).toEqual({ success: "Conta avulsa cadastrada com sucesso." });
    expect(mockState.insertedPayloads).toEqual([
      expect.objectContaining({
        owner_id: "org-owner-1",
        organization_id: "org-1",
        name: "Boleto eventual",
        amount: 90.5,
        status: "pendente",
        bill_type: "avulsa",
        recurrence: null,
      }),
    ]);
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.payable.create",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.create",
        p_target_type: "payable_bill",
        p_target_id: "bill-new",
        p_outcome: "success",
        p_metadata: {
          payable_created: true,
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("creates fixed payable bill as fixa with monthly recurrence by default", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Aluguel",
      category: "Aluguel",
      amount: "850",
      due_date: "2026-05-05",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "fixa",
    }));

    expect(result).toEqual({ success: "Conta fixa cadastrada com sucesso." });
    expect(mockState.insertedPayloads).toEqual([
      expect.objectContaining({
        name: "Aluguel",
        amount: 850,
        bill_type: "fixa",
        recurrence: "mensal",
        organization_id: "org-1",
      }),
    ]);
  });

  it("does not create payable bill when the create rate limit blocks the action", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.rateLimitAllowed = false;

    const result = await createPayableBill({}, createFormData({
      name: "Aluguel",
      category: "Aluguel",
      amount: "850",
      due_date: "2026-05-05",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "fixa",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de cadastro de conta. Tente novamente em alguns minutos.",
    });
    expect(mockState.insertedPayloads).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.create",
        p_target_type: "payable_bill",
        p_target_id: null,
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          payable_created: true,
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("returns permission error when the user cannot create for the selected member", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.accessError = new Error("Voce nao tem permissao para cadastrar conta para esta pessoa.");

    const result = await createPayableBill({}, createFormData({
      name: "Escola",
      amount: "300",
      due_date: "2026-05-10",
      responsible_member_id: "member-2",
      status: "pendente",
      bill_type: "fixa",
    }));

    expect(result).toEqual({ error: "Voce nao tem permissao para cadastrar conta para esta pessoa." });
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("updates payable bill fields and preserves one-off recurrence as null", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Boleto atualizado",
      category: "Outros",
      amount: "99.90",
      due_date: "2026-05-22",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "avulsa",
      bank_used: "Wise",
      recurrence: "mensal",
      notes: "Observacao nova",
    }));

    expect(result).toEqual({ success: "Conta atualizada com sucesso." });
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      name: "Boleto atualizado",
      category: "Outros",
      amount: 99.9,
      due_date: "2026-05-22",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "avulsa",
      bank_used: "Wise",
      recurrence: null,
      notes: "Observacao nova",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "bill-1", organization_id: "org-1" }),
    }));
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.payable.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "success",
        p_metadata: {
          payable_changed: true,
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("updates fixed payable bill with monthly recurrence", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Aluguel atualizado",
      amount: "900",
      due_date: "2026-05-05",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "fixa",
    }));

    expect(result).toEqual({ success: "Conta atualizada com sucesso." });
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      name: "Aluguel atualizado",
      amount: 900,
      bill_type: "fixa",
      recurrence: "mensal",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "bill-1", organization_id: "org-1" }),
    }));
  });

  it("does not update payable bill fields when the update rate limit blocks the action", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.rateLimitAllowed = false;

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Boleto atualizado",
      category: "Outros",
      amount: "99.90",
      due_date: "2026-05-22",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "avulsa",
      bank_used: "Wise",
      recurrence: "mensal",
      notes: "Observacao nova",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de conta. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          payable_changed: true,
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not audit payable bill update when no row was updated", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.mutationCount = 0;

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Boleto atualizado",
      category: "Outros",
      amount: "99.90",
      due_date: "2026-05-22",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "avulsa",
      bank_used: "Wise",
      recurrence: "mensal",
      notes: "Observacao nova",
    }));

    expect(result).toEqual({ error: "Conta nao encontrada." });
    expect(mockState.updatedPayloads).toHaveLength(2);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("records status audit event when full payable bill edit changes status", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.billLookup = {
      id: "bill-1",
      owner_id: "owner-1",
      responsible_member_id: "member-1",
      status: "pendente",
    };

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Conta atualizada",
      amount: "150",
      due_date: "2026-05-25",
      responsible_member_id: "member-1",
      status: "pago",
      bill_type: "avulsa",
    }));

    expect(result).toEqual({ success: "Conta atualizada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.payable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
        consume: false,
      },
      {
        operationKey: "finance.payable.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
        consume: false,
      },
      {
        operationKey: "finance.payable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
      },
      {
        operationKey: "finance.payable.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "success",
        p_metadata: {
          payable_changed: true,
          responsible_member_id: "member-1",
        },
      }),
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.status.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "success",
        p_metadata: {
          previous_status: "pendente",
          next_status: "pago",
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not update or audit full payable bill status changes when the status rate limit blocks the action", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.rateLimitAllowed = false;

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Conta atualizada",
      amount: "150",
      due_date: "2026-05-25",
      responsible_member_id: "member-1",
      status: "pago",
      bill_type: "avulsa",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.payable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.payable.status.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume update quota when full edit status limit blocks before mutation", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.payable.status.update": false,
      "finance.payable.update": true,
    };

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Conta atualizada",
      amount: "150",
      due_date: "2026-05-25",
      responsible_member_id: "member-1",
      status: "pago",
      bill_type: "avulsa",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.payable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.payable.update",
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.payable.status.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume status quota when full edit update limit blocks before mutation", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.payable.status.update": true,
      "finance.payable.update": false,
    };

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Conta atualizada",
      amount: "150",
      due_date: "2026-05-25",
      responsible_member_id: "member-1",
      status: "pago",
      bill_type: "avulsa",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de conta. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.payable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
        consume: false,
      }),
      expect.objectContaining({
        operationKey: "finance.payable.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.payable.status.update" && check.consume !== false,
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.payable.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          payable_changed: true,
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("returns permission error when updating to an inaccessible member", async () => {
    const { updatePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.accessError = new Error("Voce nao tem permissao para editar conta para esta pessoa.");

    const result = await updatePayableBill({}, createFormData({
      id: "bill-1",
      name: "Escola",
      amount: "300",
      due_date: "2026-05-10",
      responsible_member_id: "member-2",
      status: "pendente",
      bill_type: "fixa",
    }));

    expect(result).toEqual({ error: "Voce nao tem permissao para editar conta para esta pessoa." });
    expect(mockState.updatedPayloads).toHaveLength(0);
  });

  it("blocks status update with invalid status", async () => {
    const { updatePayableBillStatus } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await updatePayableBillStatus({}, createFormData({
      id: "bill-1",
      status: "cancelado",
    }));

    expect(result).toEqual({ error: "Status invalido." });
    expect(mockState.updatedPayloads).toHaveLength(0);
  });

  it("updates payable bill status", async () => {
    const { updatePayableBillStatus } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await updatePayableBillStatus({}, createFormData({
      id: "bill-1",
      status: "pago",
      bank_id: "bank-1",
    }));

    expect(result).toEqual({ success: "Status atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.payable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
      },
    ]);
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      status: "pago",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "bill-1", organization_id: "org-1" }),
    }));
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.status.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "success",
        p_metadata: {
          next_status: "pago",
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume status rate limit or audit when quick status save is unchanged", async () => {
    const { updatePayableBillStatus } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.billLookup = {
      id: "bill-1",
      owner_id: "owner-1",
      responsible_member_id: "member-1",
      status: "pago",
    };

    const result = await updatePayableBillStatus({}, createFormData({
      id: "bill-1",
      status: "pago",
      bank_id: "bank-1",
    }));

    expect(result).toEqual({ success: "Status atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      status: "pago",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "bill-1", organization_id: "org-1" }),
    }));
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not update payable bill status when the status rate limit blocks the action", async () => {
    const { updatePayableBillStatus } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.rateLimitAllowed = false;

    const result = await updatePayableBillStatus({}, createFormData({
      id: "bill-1",
      status: "pago",
      bank_id: "bank-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.payable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bill-1",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.payable.status.update",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("blocks delete without explicit confirmation", async () => {
    const { deletePayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await deletePayableBill({}, createFormData({
      id: "bill-1",
      confirm_delete: "",
    }));

    expect(result).toEqual({ error: "Confirme a exclusao antes de continuar." });
    expect(mockState.deletedIds).toHaveLength(0);
  });

  it("deletes payable bill after explicit confirmation", async () => {
    const { deletePayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await deletePayableBill({}, createFormData({
      id: "bill-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({ success: "Conta excluida com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.payable.delete",
        limit: 5,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.deletedIds).toEqual(["bill-1"]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.delete",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "success",
        p_metadata: {
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not delete payable bill when the delete rate limit blocks the action", async () => {
    const { deletePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.rateLimitAllowed = false;

    const result = await deletePayableBill({}, createFormData({
      id: "bill-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos.",
    });
    expect(mockState.deletedIds).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.payable.delete",
        p_target_type: "payable_bill",
        p_target_id: "bill-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          responsible_member_id: "member-1",
        },
      }),
    ]);
  });

  it("returns a product message when payable delete is blocked by movements", async () => {
    const { deletePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.deleteError = {
      code: "23503",
      message: "update or delete on table payable_bills violates foreign key constraint",
      details: "Key is still referenced from table financial_movements.",
    };

    const result = await deletePayableBill({}, createFormData({
      id: "bill-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({
      error: "Conta com movimentacao financeira nao pode ser excluida sem estorno.",
    });
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not audit payable bill delete when no row was deleted", async () => {
    const { deletePayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.deleteCount = 0;

    const result = await deletePayableBill({}, createFormData({
      id: "bill-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({ error: "Conta nao encontrada." });
    expect(mockState.deletedIds).toEqual(["bill-1"]);
    expect(mockState.auditEvents).toHaveLength(0);
  });
});
