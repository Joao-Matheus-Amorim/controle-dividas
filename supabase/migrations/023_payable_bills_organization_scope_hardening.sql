-- Harden public.payable_bills organization scope
-- Issue: #594
--
-- Schema-only migration.
-- This migration must not backfill data.
-- Run docs/sql/payable-bills-organization-null-preflight.sql and
-- docs/sql/payable-bills-organization-dry-run.sql before applying.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.payable_bills
    WHERE organization_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot harden public.payable_bills.organization_id: NULL organization_id rows still exist.';
  END IF;
END $$;

ALTER TABLE public.payable_bills
  ALTER COLUMN organization_id SET NOT NULL;
