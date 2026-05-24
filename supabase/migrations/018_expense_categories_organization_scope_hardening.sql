-- Harden expense_categories organization scope
-- Issue: #568
--
-- This migration intentionally targets only public.expense_categories.
-- It must not update data. Run the read-only preflight and dry-run reports before
-- applying this migration in any persistent environment.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.expense_categories
    WHERE organization_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot harden public.expense_categories.organization_id while NULL values still exist';
  END IF;
END $$;

ALTER TABLE public.expense_categories
  ALTER COLUMN organization_id SET NOT NULL;
