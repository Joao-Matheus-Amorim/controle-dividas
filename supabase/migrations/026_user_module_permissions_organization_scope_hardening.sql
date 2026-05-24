-- Issue: #612

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."user_module_permissions"
    WHERE "organization_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'user_module_permissions organization scope hardening preflight failed';
  END IF;
END $$;

ALTER TABLE "public"."user_module_permissions"
  ALTER COLUMN "organization_id" SET NOT NULL;
