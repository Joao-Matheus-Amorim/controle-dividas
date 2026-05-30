"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import { requireOrganizationAdmin } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

export type AuditEventRetentionPreflightState = {
  error?: string;
  success?: string;
  organizationId?: string;
  retentionDays?: number;
  cutoffIso?: string;
  candidateCount?: number;
  destructiveAction?: false;
};

export type AuditEventRetentionCleanupState = Omit<
  AuditEventRetentionPreflightState,
  "destructiveAction"
> & {
  deletedCount?: number;
  destructiveAction?: boolean;
};

const auditEventRetentionPolicy = {
  dataClass: "audit_events",
  retentionDays: 365,
};

function getAuditEventRetentionCutoff(now = Date.now()) {
  return new Date(
    now - auditEventRetentionPolicy.retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export async function getAuditEventRetentionPreflight(): Promise<AuditEventRetentionPreflightState> {
  const { organization } = await requireOrganizationAdmin();
  const supabase = await createClient();
  const cutoffIso = getAuditEventRetentionCutoff();

  const { error, count } = await supabase
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .lt("occurred_at", cutoffIso);

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Preflight de retencao de auditoria calculado com sucesso.",
    organizationId: organization.id,
    retentionDays: auditEventRetentionPolicy.retentionDays,
    cutoffIso,
    candidateCount: count ?? 0,
    destructiveAction: false,
  };
}

export async function cleanupExpiredAuditEvents(
  formData: FormData,
): Promise<AuditEventRetentionCleanupState> {
  const confirmation = String(formData.get("confirm_retention_cleanup") ?? "");

  if (confirmation !== "confirmado") {
    return { error: "Confirme a limpeza de auditoria antes de continuar." };
  }

  const { organization } = await requireOrganizationAdmin();
  const supabase = await createClient();
  const cutoffIso = getAuditEventRetentionCutoff();

  const { error, count } = await supabase
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .lt("occurred_at", cutoffIso);

  if (error) {
    return { error: error.message };
  }

  const candidateCount = count ?? 0;

  if (candidateCount === 0) {
    return {
      success: "Nenhum evento de auditoria elegivel para limpeza.",
      organizationId: organization.id,
      retentionDays: auditEventRetentionPolicy.retentionDays,
      cutoffIso,
      candidateCount,
      deletedCount: 0,
      destructiveAction: false,
    };
  }

  const { data: deletedCount, error: cleanupError } = await supabase.rpc(
    "cleanup_expired_audit_events",
    {
      p_organization_id: organization.id,
      p_cutoff: cutoffIso,
    },
  );

  if (cleanupError) {
    return { error: cleanupError.message };
  }

  const deleted = Number(deletedCount ?? 0);

  await recordAuditEvent({
    organizationId: organization.id,
    action: "audit.retention.cleanup",
    targetType: "audit_events",
    outcome: "success",
    metadata: {
      retention_days: auditEventRetentionPolicy.retentionDays,
      candidate_count: candidateCount,
      deleted_count: deleted,
    },
  });

  return {
    success: "Limpeza de auditoria executada com sucesso.",
    organizationId: organization.id,
    retentionDays: auditEventRetentionPolicy.retentionDays,
    cutoffIso,
    candidateCount,
    deletedCount: deleted,
    destructiveAction: true,
  };
}
