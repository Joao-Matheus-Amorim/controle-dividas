"use server";

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
