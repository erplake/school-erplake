-- Idempotent creation of touch_updated_at() function and update triggers
-- This script can be safely re-run.

BEGIN;

-- 1. Create or replace the function that stamps updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$BODY$;

-- 2. Create triggers only if they do not already exist
DO $TRIG$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_roles_updated_at'
    ) THEN
        CREATE TRIGGER trg_staff_roles_updated_at
        BEFORE UPDATE ON staff_roles
        FOR EACH ROW
        EXECUTE FUNCTION touch_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_departments_updated_at'
    ) THEN
        CREATE TRIGGER trg_staff_departments_updated_at
        BEFORE UPDATE ON staff_departments
        FOR EACH ROW
        EXECUTE FUNCTION touch_updated_at();
    END IF;
END;
$TRIG$;

COMMIT;

-- Verification (optional when running manually):
-- SELECT proname FROM pg_proc WHERE proname='touch_updated_at';
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname IN ('trg_staff_roles_updated_at','trg_staff_departments_updated_at');
