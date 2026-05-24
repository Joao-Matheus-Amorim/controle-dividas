-- Harden family_members organization scope
-- Issue: #572
--
-- This migration intentionally targets only public.family_members.
-- It must not update data. Run the read-only preflight and dry-run reports before
-- applying this migration in any persistent environment.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE organization_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot harden public.family_members.organization_id while NULL values still exist';
  END IF;
END $$;

ALTER TABLE public.family_members
  ALTER COLUMN organization_id SET NOT NULL;
