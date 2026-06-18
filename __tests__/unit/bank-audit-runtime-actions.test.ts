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
  bankLookup: {
    id: "bank-1",
    owner_id: "owner-1",
    family_member_id: "member-1",
    bank_name: "Wise",
    account_type: "",
    current_balance: 100,
    currency: "EUR",
    notes: null,
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  insertedRows: [] as Array<{ table: string; payload: Record<string, unknown> }>,
  insertedBank: {
    id: "bank-created-1",
  } as Record<string, unknown> | null,
  updatedRows: [] as Array<{ table: string; payload: Record<string, unknown>; filters: Record<string, unknown> }>,
  deletedRows: [] as Array<{ table: string; filters: Record<string, unknown> }>,
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
  let insertPayload: Record<string, unknown> | null = null;
  let updatePayload: Record<string, unknown> | null = null;
  let deleteMode = false;

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if ((updatePayload || deleteMode) && key === "organization_id") {
        if (updatePayload) {
          mockState.updatedRows.push({ table, payload: updatePayload, filters: { ...filters } });
        }

        if (deleteMode) {
          mockState.deletedRows.push({ table, filters: { ...filters } });
        }

        return Promise.resolve({ error: mockState.mutationError, count: mockState.mutationCount });
      }

      return query;
    },
    maybeSingle() {
      if (table === "banks") {
        return Promise.resolve({ data: mockState.bankLookup, error: null });
      }

      if (table === "family_members") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    single() {
      if (insertPayload) {
        return Promise.resolve({ data: mockState.insertedBank, error: mockState.mutationError });
      }

      return Promise.resolve({ data: null, error: null });
    },
    insert(payload: Record<string, unknown>) {
      insertPayload = payload;
      mockState.insertedRows.push({ table, payload });

      return query;
    },
    update(payload: Record<string, unknown>, options?: Record<string, unknown>) {
      if (options?.count !== "exact") {
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
      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
    if (!["banks", "family_members"].includes(table)) {
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
  assertCanAccessMember: vi.fn(async () => true),
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

describe("bank audit runtime actions", () => {
  beforeEach(() => {
    mockState.bankLookup = {
      id: "bank-1",
      owner_id: "owner-1",
      family_member_id: "member-1",
      bank_name: "Wise",
      account_type: "",
      current_balance: 100,
      currency: "EUR",
      notes: null,
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.updatedRows = [];
    mockState.insertedRows = [];
    mockState.insertedBank = {
      id: "bank-created-1",
    };
    mockState.deletedRows = [];
    mockState.mutationCount = 1;
    mockState.mutationError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitAllowedByOperation = {};
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("records bank create audit event through rate limit boundary", async () => {
    const { createBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await createBankAccount({}, createFormData({
      family_member_id: "member-1",
      bank_name: "Nubank",
      account_type: "Conta corrente",
      current_balance: "250",
      currency: "BRL",
      notes: "uso diario",
    }));

    expect(result).toEqual({ success: "Banco cadastrado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.bank.create",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.insertedRows).toEqual([
      {
        table: "banks",
        payload: expect.objectContaining({
          owner_id: "org-owner-1",
          organization_id: "org-1",
          family_member_id: "member-1",
          bank_name: "Nubank",
          account_type: "Conta corrente",
          current_balance: 250,
          currency: "BRL",
        }),
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.create",
        p_target_type: "bank",
        p_target_id: "bank-created-1",
        p_outcome: "success",
        p_metadata: {
          bank_created: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not create bank account when the create rate limit blocks the action", async () => {
    const { createBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.rateLimitAllowed = false;

    const result = await createBankAccount({}, createFormData({
      family_member_id: "member-1",
      bank_name: "Nubank",
      current_balance: "250",
      currency: "BRL",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de cadastro de banco. Tente novamente em alguns minutos.",
    });
    expect(mockState.insertedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.create",
        p_target_type: "bank",
        p_target_id: null,
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          bank_created: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("records bank balance audit event from the quick balance action", async () => {
    const { updateBankAccountBalance } = await import("@/app/protected/bancos/actions");

    const result = await updateBankAccountBalance(createFormData({
      id: "bank-1",
      current_balance: "125.50",
    }));

    expect(result).toEqual({ success: "Saldo atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.bank.balance.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bank-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.bank.balance.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "success",
        p_metadata: {
          balance_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not record bank balance audit event when the quick balance value is unchanged", async () => {
    const { updateBankAccountBalance } = await import("@/app/protected/bancos/actions");

    const result = await updateBankAccountBalance(createFormData({
      id: "bank-1",
      current_balance: "100",
    }));

    expect(result).toEqual({ success: "Saldo atualizado com sucesso." });
    expect(mockState.updatedRows).toHaveLength(1);
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("records bank balance audit event from the full edit form", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Wise",
      current_balance: "180",
      currency: "EUR",
    }));

    expect(result).toEqual({ success: "Banco atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.bank.balance.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bank-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.balance.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_metadata: {
          balance_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not record bank balance audit event when the full edit balance value is unchanged", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Wise",
      current_balance: "100",
      currency: "EUR",
    }));

    expect(result).toEqual({ success: "Banco atualizado com sucesso." });
    expect(mockState.updatedRows).toHaveLength(1);
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("records bank update audit event when full edit changes bank fields", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Banco Inter",
      account_type: "Conta corrente",
      current_balance: "100",
      currency: "BRL",
    }));

    expect(result).toEqual({ success: "Banco atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.bank.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bank-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "success",
        p_metadata: {
          bank_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not update full edit bank fields when the write rate limit blocks the action", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Banco Inter",
      account_type: "Conta corrente",
      current_balance: "100",
      currency: "BRL",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de banco. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          bank_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume balance quota when full edit bank write limit blocks before balance check", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.bank.update": false,
      "finance.bank.balance.update": true,
    };

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Banco Inter",
      account_type: "Conta corrente",
      current_balance: "180",
      currency: "BRL",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de banco. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.bank.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bank-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.bank.balance.update",
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          bank_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not consume bank update quota when full edit balance limit blocks before mutation", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.rateLimitAllowedByOperation = {
      "finance.bank.update": true,
      "finance.bank.balance.update": false,
    };

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Banco Inter",
      account_type: "Conta corrente",
      current_balance: "180",
      currency: "BRL",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de saldo. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.rateLimitChecks).toEqual([
      expect.objectContaining({
        operationKey: "finance.bank.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bank-1",
        consume: false,
      }),
      expect.objectContaining({
        operationKey: "finance.bank.balance.update",
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "bank-1",
        consume: false,
      }),
    ]);
    expect(mockState.rateLimitChecks.some(
      (check) => check.operationKey === "finance.bank.update" && check.consume !== false,
    )).toBe(false);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.balance.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          balance_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not update quick bank balance when the balance rate limit blocks the action", async () => {
    const { updateBankAccountBalance } = await import("@/app/protected/bancos/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateBankAccountBalance(createFormData({
      id: "bank-1",
      current_balance: "125.50",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de saldo. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.bank.balance.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          balance_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not update full edit bank balance when the balance rate limit blocks the action", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Wise",
      current_balance: "180",
      currency: "EUR",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de saldo. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.bank.balance.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          balance_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not record bank balance audit event when no row was updated", async () => {
    const { updateBankAccountBalance } = await import("@/app/protected/bancos/actions");
    mockState.mutationCount = 0;

    const result = await updateBankAccountBalance(createFormData({
      id: "bank-1",
      current_balance: "125.50",
    }));

    expect(result).toEqual({ error: "Banco nao encontrado." });
    expect(mockState.updatedRows).toHaveLength(1);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("records bank delete audit event only after an exact row delete", async () => {
    const { deleteBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await deleteBankAccount(createFormData({
      id: "bank-1",
    }));

    expect(result).toEqual({ success: "Banco excluido com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.bank.delete",
        limit: 5,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.deletedRows).toHaveLength(1);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.bank.delete",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "success",
        p_metadata: {
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not record bank delete audit event when no row was deleted", async () => {
    const { deleteBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.mutationCount = 0;

    const result = await deleteBankAccount(createFormData({
      id: "bank-1",
    }));

    expect(result).toEqual({ error: "Banco nao encontrado." });
    expect(mockState.deletedRows).toHaveLength(1);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not delete bank account when the delete rate limit blocks the action", async () => {
    const { deleteBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.rateLimitAllowed = false;

    const result = await deleteBankAccount(createFormData({
      id: "bank-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos.",
    });
    expect(mockState.deletedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.bank.delete",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          family_member_id: "member-1",
        },
      }),
    ]);
  });
});
