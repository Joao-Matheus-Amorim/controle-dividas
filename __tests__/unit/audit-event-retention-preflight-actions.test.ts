import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  organization: {
    id: "org-1",
    slug: "amorim",
  },
  count: 7 as number | null,
  error: null as { message: string } | null,
  adminError: null as Error | null,
  queries: [] as Array<{
    table: string;
    select: { columns: string; options: Record<string, unknown> };
    filters: Record<string, unknown>;
  }>,
  destructiveCalls: [] as string[],
  cleanupDeletedCount: 7,
  cleanupError: null as { message: string } | null,
  auditEvents: [] as Array<Record<string, unknown>>,
}));

function makeQuery(table: string) {
  const filters: Record<string, unknown> = {};
  let selectPayload: { columns: string; options: Record<string, unknown> } | null = null;

  const query = {
    select(columns: string, options: Record<string, unknown>) {
      selectPayload = { columns, options };
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;
      return query;
    },
    lt(key: string, value: unknown) {
      filters[key] = value;
      mockState.queries.push({
        table,
        select: selectPayload ?? { columns: "", options: {} },
        filters: { ...filters },
      });

      return Promise.resolve({ error: mockState.error, count: mockState.count });
    },
    delete() {
      mockState.destructiveCalls.push("delete");
      return query;
    },
    update() {
      mockState.destructiveCalls.push("update");
      return query;
    },
    rpc() {
      mockState.destructiveCalls.push("rpc");
      return query;
    },
  };

  return query;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc(name: string, payload: Record<string, unknown>) {
      if (name === "cleanup_expired_audit_events") {
        mockState.destructiveCalls.push(name);

        return Promise.resolve({
          data: mockState.cleanupDeletedCount,
          error: mockState.cleanupError,
        });
      }

      if (name === "record_audit_event") {
        mockState.auditEvents.push(payload);

        return Promise.resolve({ data: "audit-1", error: null });
      }

      throw new Error(`Unexpected rpc: ${name}`);
    },
    from(table: string) {
      if (table !== "audit_events") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeQuery(table);
    },
  })),
}));

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAdmin: vi.fn(async () => {
    if (mockState.adminError) {
      throw mockState.adminError;
    }

    return {
      organization: mockState.organization,
      membership: {
        role: "owner",
        is_active: true,
      },
    };
  }),
}));

describe("audit event retention preflight actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T12:00:00.000Z"));
    mockState.count = 7;
    mockState.error = null;
    mockState.adminError = null;
    mockState.queries = [];
    mockState.destructiveCalls = [];
    mockState.cleanupDeletedCount = 7;
    mockState.cleanupError = null;
    mockState.auditEvents = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts organization-scoped audit events older than the retention cutoff", async () => {
    const { getAuditEventRetentionPreflight } = await import(
      "@/app/protected/configuracoes/audit-retention-actions"
    );

    const result = await getAuditEventRetentionPreflight();

    expect(result).toEqual({
      success: "Preflight de retencao de auditoria calculado com sucesso.",
      organizationId: "org-1",
      retentionDays: 365,
      cutoffIso: "2025-05-30T12:00:00.000Z",
      candidateCount: 7,
      destructiveAction: false,
    });
    expect(mockState.queries).toEqual([
      {
        table: "audit_events",
        select: {
          columns: "id",
          options: { count: "exact", head: true },
        },
        filters: {
          organization_id: "org-1",
          occurred_at: "2025-05-30T12:00:00.000Z",
        },
      },
    ]);
    expect(mockState.destructiveCalls).toHaveLength(0);
  });

  it("returns the read error without running destructive work", async () => {
    const { getAuditEventRetentionPreflight } = await import(
      "@/app/protected/configuracoes/audit-retention-actions"
    );
    mockState.error = { message: "permission denied" };

    const result = await getAuditEventRetentionPreflight();

    expect(result).toEqual({ error: "permission denied" });
    expect(mockState.destructiveCalls).toHaveLength(0);
  });

  it("requires organization admin access before counting audit events", async () => {
    const { getAuditEventRetentionPreflight } = await import(
      "@/app/protected/configuracoes/audit-retention-actions"
    );
    mockState.adminError = new Error("Voce nao tem permissao administrativa nesta organizacao.");

    await expect(getAuditEventRetentionPreflight()).rejects.toThrow(
      "Voce nao tem permissao administrativa nesta organizacao.",
    );
    expect(mockState.queries).toHaveLength(0);
    expect(mockState.destructiveCalls).toHaveLength(0);
  });

  it("requires explicit confirmation before cleanup", async () => {
    const { cleanupExpiredAuditEvents } = await import(
      "@/app/protected/configuracoes/audit-retention-actions"
    );

    const result = await cleanupExpiredAuditEvents(new FormData());

    expect(result).toEqual({ error: "Confirme a limpeza de auditoria antes de continuar." });
    expect(mockState.queries).toHaveLength(0);
    expect(mockState.destructiveCalls).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("skips cleanup rpc and audit when there are no eligible audit events", async () => {
    const { cleanupExpiredAuditEvents } = await import(
      "@/app/protected/configuracoes/audit-retention-actions"
    );
    const formData = new FormData();
    formData.set("confirm_retention_cleanup", "confirmado");
    mockState.count = 0;

    const result = await cleanupExpiredAuditEvents(formData);

    expect(result).toEqual({
      success: "Nenhum evento de auditoria elegivel para limpeza.",
      organizationId: "org-1",
      retentionDays: 365,
      cutoffIso: "2025-05-30T12:00:00.000Z",
      candidateCount: 0,
      deletedCount: 0,
      destructiveAction: false,
    });
    expect(mockState.destructiveCalls).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("cleans expired audit events through the privileged rpc and records the cleanup audit event", async () => {
    const { cleanupExpiredAuditEvents } = await import(
      "@/app/protected/configuracoes/audit-retention-actions"
    );
    const formData = new FormData();
    formData.set("confirm_retention_cleanup", "confirmado");

    const result = await cleanupExpiredAuditEvents(formData);

    expect(result).toEqual({
      success: "Limpeza de auditoria executada com sucesso.",
      organizationId: "org-1",
      retentionDays: 365,
      cutoffIso: "2025-05-30T12:00:00.000Z",
      candidateCount: 7,
      deletedCount: 7,
      destructiveAction: true,
    });
    expect(mockState.destructiveCalls).toEqual(["cleanup_expired_audit_events"]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "audit.retention.cleanup",
        p_target_type: "audit_events",
        p_outcome: "success",
        p_metadata: {
          retention_days: 365,
          candidate_count: 7,
          deleted_count: 7,
        },
      }),
    ]);
  });
});
