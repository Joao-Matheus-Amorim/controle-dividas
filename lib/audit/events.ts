import { createClient } from "@/lib/supabase/server";

export type AuditEventOutcome = "success" | "denied" | "validation_error" | "failure";

type RecordAuditEventInput = {
  organizationId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  outcome: AuditEventOutcome;
  requestId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordAuditEvent({
  organizationId,
  action,
  targetType,
  targetId = null,
  outcome,
  requestId = null,
  metadata = {},
}: RecordAuditEventInput): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_audit_event", {
      p_organization_id: organizationId,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_outcome: outcome,
      p_request_id: requestId,
      p_metadata: metadata,
    });

    return !error;
  } catch {
    return false;
  }
}
