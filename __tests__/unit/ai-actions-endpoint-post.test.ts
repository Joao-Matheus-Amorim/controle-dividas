import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  auditLog: vi.fn(async () => ({ data: null, error: null })),
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 19, resetInMs: 60_000 })),
  createExpenseFromAi: vi.fn(async () => ({ success: "Gasto criado com sucesso." })),
  createPayableBillFromAi: vi.fn(async () => ({ success: "Conta criada com sucesso." })),
  createReceivableIncomeFromAi: vi.fn(async () => ({ success: "Recebimento criado com sucesso." })),
  createBankAccountFromAi: vi.fn(async () => ({ success: "Banco criado com sucesso." })),
  deleteExpenseFromAi: vi.fn(async () => ({ success: "Gasto excluido com sucesso." })),
  deletePayableBillFromAi: vi.fn(async () => ({ success: "Conta excluida com sucesso." })),
  deleteReceivableIncomeFromAi: vi.fn(async () => ({ success: "Recebimento excluido com sucesso." })),
  deleteBankAccountFromAi: vi.fn(async () => ({ success: "Banco excluido com sucesso." })),
  markPayablePaidFromAi: vi.fn(async () => ({ success: "Conta marcada como paga com sucesso." })),
  markReceivableReceivedFromAi: vi.fn(async () => ({ success: "Recebimento marcado como recebido com sucesso." })),
}));

const mockSupabase = {
  auth: {
    getUser: vi.fn(async () => ({ data: { user: { id: "auth-user-1" } }, error: null })),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

vi.mock("@/lib/finance/access-control", () => ({
  getCurrentOrganizationProfile: vi.fn(async () => ({ id: "profile-1", is_active: true })),
}));

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAccess: vi.fn(async () => ({
    organization: { id: "org-1", slug: "amorim", owner_auth_user_id: "owner-1" },
  })),
}));

vi.mock("@/lib/ai/audit", () => ({
  auditLog: mocks.auditLog,
}));

vi.mock("@/lib/ai/rate-limiter", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/ai/manager/actions-handler", () => ({
  createExpenseFromAi: mocks.createExpenseFromAi,
  createPayableBillFromAi: mocks.createPayableBillFromAi,
  createReceivableIncomeFromAi: mocks.createReceivableIncomeFromAi,
  createBankAccountFromAi: mocks.createBankAccountFromAi,
  deleteExpenseFromAi: mocks.deleteExpenseFromAi,
  deletePayableBillFromAi: mocks.deletePayableBillFromAi,
  deleteReceivableIncomeFromAi: mocks.deleteReceivableIncomeFromAi,
  deleteBankAccountFromAi: mocks.deleteBankAccountFromAi,
  markPayablePaidFromAi: mocks.markPayablePaidFromAi,
  markReceivableReceivedFromAi: mocks.markReceivableReceivedFromAi,
}));

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai/actions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/ai/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19, resetInMs: 60_000 });
    mocks.createExpenseFromAi.mockResolvedValue({ success: "Gasto criado com sucesso." });
  });

  it("executes a confirmed action", async () => {
    const { POST } = await import("@/app/api/ai/actions/route");
    const response = await POST(request({ actionType: "create_expense", payload: { amount: 83 }, confirmation: "confirmado" }) as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.result.message).toBe("Gasto criado com sucesso.");
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("profile-1");
    expect(mocks.createExpenseFromAi).toHaveBeenCalledWith({ amount: 83 }, expect.objectContaining({ profileId: "profile-1", organizationId: "org-1", confirmation: "confirmado" }));
  });

  it("rejects missing confirmation before executing", async () => {
    const { POST } = await import("@/app/api/ai/actions/route");
    const response = await POST(request({ actionType: "create_expense", payload: { amount: 83 } }) as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.needsConfirmation).toBe(true);
    expect(mocks.createExpenseFromAi).not.toHaveBeenCalled();
    expect(mocks.auditLog).toHaveBeenCalledWith(expect.objectContaining({ success: false, result: { error: "confirmation_required" } }));
  });

  it("does not convert handler review-required responses into success", async () => {
    mocks.createExpenseFromAi.mockResolvedValueOnce({ needsConfirmation: true, summary: "Campos obrigatorios faltando: amount.", details: {} } as never);
    const { POST } = await import("@/app/api/ai/actions/route");
    const response = await POST(request({ actionType: "create_expense", payload: {}, confirmation: "confirmado" }) as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.needsConfirmation).toBe(true);
    expect(json.error).toBe("Campos obrigatorios faltando: amount.");
    expect(mocks.auditLog).toHaveBeenCalledWith(expect.objectContaining({ success: false, result: expect.objectContaining({ error: "review_required" }) }));
  });

  it("returns 429 when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetInMs: 15_000 });
    const { POST } = await import("@/app/api/ai/actions/route");
    const response = await POST(request({ actionType: "create_expense", payload: { amount: 83 }, confirmation: "confirmado" }) as never);
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json.retryAfterMs).toBe(15_000);
    expect(mocks.createExpenseFromAi).not.toHaveBeenCalled();
  });
});
