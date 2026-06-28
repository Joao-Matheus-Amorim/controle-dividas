import { createAdminClient } from '@/lib/supabase/admin';

interface AuditRecord {
  action: string;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  success: boolean;
  organization_id: string;
  created_by: string;
}

export async function auditLog(record: AuditRecord) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from('ai_actions').insert({
    action: record.action,
    payload: record.payload,
    result: record.result,
    success: record.success,
    organization_id: record.organization_id,
    created_by: record.created_by,
  });

  if (error) {
    console.error('[AI Audit] Failed to log action:', error);
  }

  return { data, error };
}
