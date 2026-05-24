-- Harden public.expenses organization scope
-- Issue: #588
--
-- Schema-only migration.
-- This migration must not backfill data.
-- Run docs/sql/expenses-organization-null-preflight.sql and
-- docs/sql/expenses-organization-backfill-dry-run.sql before applying.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE organization_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot harden public.expenses.organization_id: NULL organization_id rows still exist.';
  END IF;
END $$;

ALTER TABLE public.expenses
  ALTER COLUMN organization_id SET NOT NULL;
