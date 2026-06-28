-- Migration 071: Audit log retention policy (90 days)
-- Ensures ai_actions table doesn't grow indefinitely

-- Create index to speed up deletion queries
CREATE INDEX IF NOT EXISTS idx_ai_actions_created_at 
ON public.ai_actions (created_at DESC);

-- Function to delete expired audit logs
CREATE OR REPLACE FUNCTION public.delete_expired_audit_logs(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_actions
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION public.delete_expired_audit_logs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_expired_audit_logs(INTEGER) TO service_role;
