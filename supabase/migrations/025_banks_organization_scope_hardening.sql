-- Issue: #606

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."banks"
    WHERE "organization_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'banks organization scope hardening preflight failed';
  END IF;
END $$;

ALTER TABLE "public"."banks"
  ALTER COLUMN "organization_id" SET NOT NULL;
