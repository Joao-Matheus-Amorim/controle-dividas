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
  insertedIncome: {
    id: "income-created-1",
  } as Record<string, unknown> | null,
  updatedPayloads: [] as Array<Record<string, unknown>>,
  deletedIds: [] as string[],
  bankLookup: {
    id: "bank-1",
    organization_id: "org-1",
    family_member_id: "member-1",
    currency: "BRL",
  } as Record<string, unknown> | null,
  incomeLookup: {
    id: "income-1",
    owner_id: "owner-1",
    receiver_member_id: "member-1",
    source: "Salario",
    payment_origin: null,
    income_type: "fixa",
    amount: 1800,
    expected_date: "2026-05-31",
    status: "previsto",
    receiving_bank: null,
    notes: null,
  } as Record<string, unknown> | null,
  incomeSourceLookup: {
    id: "source-1",
    organization_id: "org-1",
    name: "Freelance",
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  insertError: null as { message: string } | null,
  updateError: null as { message: string } | null,
  updateCount: 1 as number | null,
  deleteError: null as { message: string } | null,
  deleteCount: 1 as number | null,
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
  let insertPayload: Record<string, unknown> | null = null;
  let updatePayload: Record<string, unknown> | null = null;
  let deleteMode = false;

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (updatePayload && key === "organization_id") {
        mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });
        return Promise.resolve({ error: mockState.updateError, count: mockState.updateCount });
      }

      if (deleteMode && key === "organization_id") {
        return Promise.resolve({ error: mockState.deleteError, count: mockState.deleteCount });
      }

      if (deleteMode && key === "id") {
        mockState.deletedIds.push(String(value));
      }

      return query;
    },
    ilike(key: string, value: unknown) {
      filters[key] = value;
      return query;
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
    maybeSingle() {
      if (table === "receivable_incomes") {
        return Promise.resolve({ data: mockState.incomeLookup, error: null });
      }

      if (table === "family_members") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      if (table === "banks") {
        return Promise.resolve({ data: mockState.bankLookup, error: null });
      }

      if (table === "receivable_income_sources") {
        return Promise.resolve({ data: mockState.incomeSourceLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    limit(value: number) {
      if (value !== 1) {
        throw new Error("Expected existence lookup limit");
      }

      filters.limit = value;
      return query;
    },
    then(
      onfulfilled?: ((value: { data: Record<string, unknown>[]; error: null }) => unknown) | null,
      onrejected?: ((reason: unknown) => unknown) | null,
    ) {
      const data = table === "banks"
        ? (mockState.bankLookup ? [mockState.bankLookup] : [])
        : table === "receivable_income_sources"
          ? (mockState.incomeSourceLookup ? [mockState.incomeSourceLookup] : [])
          : [];

      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    },
    single() {
      if (insertPayload) {
        return Promise.resolve({ data: mockState.insertedIncome, error: mockState.insertError });
      }

      return Promise.resolve({ data: null, error: null });
    },
    insert(payload: Record<string, unknown>) {
      insertPayload = payload;
      mockState.insertedPayloads.push(payload);

      return query;
    },
    update(payload: Record<string, unknown>, options?: Record<string, unknown>) {
      if (options && options.count !== "exact") {
        throw new Error("Expected exact update count");
      }

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
      if (name === "mark_receivable_income_received_with_movement") {
        mockState.updatedPayloads.push({
          status: "recebido",
          organization_id: payload.target_organization_id,
          filters: {
            id: payload.target_receivable_income_id,
            organization_id: payload.target_organization_id,
          },
        });

        return Promise.resolve({ error: mockState.updateError });
      }

      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (![
        "receivable_incomes",
        "family_members",
        "banks",
        "financial_movements",
        "receivable_income_sources",
      ].includes(table)) {
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

describe("receivable income actions", () => {
  beforeEach(() => {
    mockState.insertedPayloads = [];
    mockState.insertedIncome = {
      id: "income-created-1",
    };
    mockState.updatedPayloads = [];
    mockState.deletedIds = [];
    mockState.bankLookup = {
      id: "bank-1",
      organization_id: "org-1",
      family_member_id: "member-1",
      currency: "BRL",
    };
    mockState.incomeLookup = {
      id: "income-1",
      owner_id: "owner-1",
      receiver_member_id: "member-1",
      source: "Salario",
      payment_origin: null,
      income_type: "fixa",
      amount: 1800,
      expected_date: "2026-05-31",
      status: "previsto",
      receiving_bank: null,
      notes: null,
    };
    mockState.incomeSourceLookup = {
      id: "source-1",
      organization_id: "org-1",
      name: "Freelance",
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.insertError = null;
    mockState.updateError = null;
    mockState.updateCount = 1;
    mockState.deleteError = null;
    mockState.deleteCount = 1;
    mockState.accessError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitAllowedByOperation = {};
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("creates receivable income through audit and rate limit boundaries", async () => {
    const { createReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");

    const result = await createReceivableIncome({}, createFormData({
      receiver_member_id: "member-1",
      source: "Freelance",
      payment_origin: "Cliente ACME",
      income_type: "variavel",
      amount: "1500",
      expected_date: "2026-06-10",
      status: "previsto",
      receiving_bank: "Banco A",
      notes: "observacao local",
    }));

    expect(result).toEqual({ success: "Conta a receber cadastrada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.receivable.create",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.insertedPayloads).toEqual([
      expect.objectContaining({
        owner_id: "org-owner-1",
        organization_id: "org-1",
        receiver_member_id: "member-1",
        source: "Freelance",
        payment_origin: "Cliente ACME",
        income_type: "variavel",
        amount: 1500,
        expected_date: "2026-06-10",
        status: "previsto",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.create",
        p_target_type: "receivable_income",
        p_target_id: "income-created-1",
        p_outcome: "success",
        p_metadata: {
          receivable_created: true,
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not create receivable income when the create rate limit blocks the action", async () => {
    const { createReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.rateLimitAllowed = false;

    const result = await createReceivableIncome({}, createFormData({
      receiver_member_id: "member-1",
      source: "Freelance",
      payment_origin: "Cliente XPTO",
      income_type: "variavel",
      amount: "1500",
      expected_date: "2026-06-10",
      status: "previsto",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de cadastro de recebimento. Tente novamente em alguns minutos.",
    });
    expect(mockState.insertedPayloads).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.create",
        p_target_type: "receivable_income",
        p_target_id: null,
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          receivable_created: true,
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("blocks status update with invalid status", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "cancelado",
    }));

    expect(result).toEqual({ error: "Status invalido." });
    expect(mockState.updatedPayloads).toHaveLength(0);
  });

  it("returns Supabase status update errors instead of swallowing them", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");
    mockState.updateError = { message: "database status update failed" };

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "recebido",
      bank_id: "bank-1",
    }));

    expect(result).toEqual({ error: "database status update failed" });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.receivable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      },
    ]);
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      status: "recebido",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "income-1", organization_id: "org-1" }),
    }));
  });

  it("updates receivable income status successfully", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "recebido",
      bank_id: "bank-1",
    }));

    expect(result).toEqual({ success: "Status atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.receivable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      },
    ]);
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      status: "recebido",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "income-1", organization_id: "org-1" }),
    }));
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.receivable.status.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "success",
        p_metadata: {
          next_status: "recebido",
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume status rate limit or audit when quick status save is unchanged", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");
    mockState.incomeLookup = {
      id: "income-1",
      owner_id: "owner-1",
      receiver_member_id: "member-1",
      status: "recebido",
    };

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "recebido",
      bank_id: "bank-1",
    }));

    expect(result).toEqual({ success: "Status atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      status: "recebido",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "income-1", organization_id: "org-1" }),
    }));
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not update receivable income status when the status rate limit blocks the action", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "recebido",
      bank_id: "bank-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.receivable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.status.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("records status audit event when full receivable edit changes status", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Salario",
      income_type: "fixa",
      amount: "1800",
      expected_date: "2026-05-31",
      status: "recebido",
    }));

    expect(result).toEqual({ success: "Recebimento atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.receivable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.receivable.status.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "success",
        p_metadata: {
          previous_status: "previsto",
          next_status: "recebido",
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("records write audit event when full receivable edit changes receivable fields", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Freelance",
      payment_origin: "Cliente XPTO",
      income_type: "variavel",
      amount: "2000",
      expected_date: "2026-06-30",
      status: "previsto",
      receiving_bank: "Banco B",
    }));

    expect(result).toEqual({ success: "Recebimento atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.receivable.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      },
    ]);
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      receiver_member_id: "member-1",
      source: "Freelance",
      payment_origin: "Cliente XPTO",
      income_type: "variavel",
      amount: 2000,
      expected_date: "2026-06-30",
      status: "previsto",
      receiving_bank: "Banco B",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "income-1", organization_id: "org-1" }),
    }));
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "success",
        p_metadata: {
          receivable_changed: true,
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("preflights and consumes paired limits when full receivable edit changes status and fields", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Freelance",
      income_type: "variavel",
      amount: "2000",
      expected_date: "2026-06-30",
      status: "recebido",
      receiving_bank: "Banco B",
    }));

    expect(result).toEqual({ success: "Recebimento atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.receivable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
        consume: false,
      },
      {
        operationKey: "finance.receivable.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
        consume: false,
      },
      {
        operationKey: "finance.receivable.status.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      },
      {
        operationKey: "finance.receivable.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "success",
        p_metadata: {
          receivable_changed: true,
          receiver_member_id: "member-1",
        },
      }),
      expect.objectContaining({
        p_action: "finance.receivable.status.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "success",
        p_metadata: {
          previous_status: "previsto",
          next_status: "recebido",
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not update or audit full receivable edits when the write rate limit blocks the action", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Freelance",
      income_type: "variavel",
      amount: "2000",
      expected_date: "2026-06-30",
      status: "previsto",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de recebimento. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.receivable.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          receivable_changed: true,
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume update quota when full edit status limit blocks before mutation", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.receivable.status.update": false,
      "finance.receivable.update": true,
    };

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Freelance",
      income_type: "variavel",
      amount: "2000",
      expected_date: "2026-06-30",
      status: "recebido",
      receiving_bank: "Banco B",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.receivable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.receivable.update",
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.status.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume status quota when full edit update limit blocks before mutation", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.receivable.status.update": true,
      "finance.receivable.update": false,
    };

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Freelance",
      income_type: "variavel",
      amount: "2000",
      expected_date: "2026-06-30",
      status: "recebido",
      receiving_bank: "Banco B",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de recebimento. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.receivable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
        consume: false,
      }),
      expect.objectContaining({
        operationKey: "finance.receivable.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.receivable.status.update" && check.consume !== false,
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          receivable_changed: true,
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not audit full receivable edit when no row was updated", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.updateCount = 0;

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Freelance",
      income_type: "variavel",
      amount: "2000",
      expected_date: "2026-06-30",
      status: "previsto",
    }));

    expect(result).toEqual({ error: "Recebimento nao encontrado." });
    expect(mockState.updatedPayloads).toHaveLength(1);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not update or audit full receivable status changes when the status rate limit blocks the action", async () => {
    const { updateReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateReceivableIncome({}, createFormData({
      id: "income-1",
      receiver_member_id: "member-1",
      source: "Salario",
      income_type: "fixa",
      amount: "1800",
      expected_date: "2026-05-31",
      status: "recebido",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedPayloads).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.receivable.status.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "income-1",
      }),
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.receivable.status.update",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("returns permission errors for delete instead of swallowing them", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.accessError = new Error("Voce nao tem permissao para executar esta acao para esta pessoa.");

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({ error: "Voce nao tem permissao para executar esta acao para esta pessoa." });
    expect(mockState.deletedIds).toHaveLength(0);
  });

  it("returns Supabase delete errors instead of swallowing them", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.deleteError = { message: "database delete failed" };

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({ error: "database delete failed" });
    expect(mockState.deletedIds).toEqual(["income-1"]);
  });

  it("deletes receivable income successfully", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({ success: "Recebimento excluido com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.receivable.delete",
        limit: 5,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.deletedIds).toEqual(["income-1"]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.receivable.delete",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "success",
        p_metadata: {
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not delete receivable income when the delete rate limit blocks the action", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.rateLimitAllowed = false;

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos.",
    });
    expect(mockState.deletedIds).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.receivable.delete",
        p_target_type: "receivable_income",
        p_target_id: "income-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          receiver_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not audit receivable income delete when no row was deleted", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.deleteCount = 0;

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({ error: "Recebimento nao encontrado." });
    expect(mockState.deletedIds).toEqual(["income-1"]);
    expect(mockState.auditEvents).toHaveLength(0);
  });
});
