-- Harden public.receivable_incomes organization scope
-- Issue: #600
--
-- Schema-only migration.
-- This migration must not backfill data.
-- Run docs/sql/receivable-incomes-organization-null-preflight.sql and
-- docs/sql/receivable-incomes-organization-dry-run.sql before applying.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.receivable_incomes
    WHERE organization_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot harden public.receivable_incomes.organization_id: NULL organization_id rows still exist.';
  END IF;
END $$;

ALTER TABLE public.receivable_incomes
  ALTER COLUMN organization_id SET NOT NULL;
