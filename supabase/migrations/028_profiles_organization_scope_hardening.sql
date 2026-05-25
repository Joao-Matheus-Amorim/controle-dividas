-- Issue: #639

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."profiles"
    WHERE "organization_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'profiles organization scope hardening preflight failed';
  END IF;
END $$;

ALTER TABLE "public"."profiles"
  ALTER COLUMN "organization_id" SET NOT NULL;