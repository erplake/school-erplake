-- grants_full_access.sql
-- Purpose: Grant broad privileges on application schemas to role erplake.
-- NOTE: Review before running in production. Adjust schema list or narrow privileges as needed.
-- Run as a superuser (e.g., postgres):
--   psql -h localhost -p 5544 -U postgres -d schooldb -f infra/sql/grants_full_access.sql

-- 1. Ensure role exists (will NOT reset password if already present).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erplake') THEN
        CREATE ROLE erplake LOGIN PASSWORD 'erplake'; -- adjust password policy as required
    END IF;
END$$;

-- 2. Create / ensure application schemas (skip if they're already created by migrations).
DO $$
DECLARE
    s TEXT;
    schemas TEXT[] := ARRAY['public','core','academics','files','payments'];
BEGIN
    FOREACH s IN ARRAY schemas LOOP
        IF s <> 'public' THEN
            EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', s);
        END IF;
        -- Allow role to use and (optionally) create objects in each schema
        EXECUTE format('GRANT USAGE, CREATE ON SCHEMA %I TO %I', s, 'erplake');
    END LOOP;
END$$;

-- 3. Grant table privileges (existing tables).
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
       SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_type='BASE TABLE'
         AND table_schema IN ('public','core','academics','files','payments')
    LOOP
        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I.%I TO %I',
            r.table_schema, r.table_name, 'erplake'
        );
    END LOOP;
END$$;

-- 4. Grant sequence privileges (needed for nextval on SERIAL/BIGSERIAL columns).
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT sequence_schema, sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema IN ('public','core','academics','files','payments')
    LOOP
        EXECUTE format(
            'GRANT USAGE, SELECT, UPDATE ON SEQUENCE %I.%I TO %I',
            r.sequence_schema, r.sequence_name, 'erplake'
        );
    END LOOP;
END$$;

-- 5. Grant EXECUTE on existing functions (if any) in target schemas.
DO $$
DECLARE
    r RECORD;
    fn_oid OID;
    args TEXT;
BEGIN
    FOR r IN
        SELECT n.nspname AS schema_name, p.proname, p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname IN ('public','core','academics','files','payments')
    LOOP
        fn_oid := r.oid;
        args := pg_get_function_identity_arguments(fn_oid);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO %I', r.schema_name, r.proname, args, 'erplake');
    END LOOP;
END$$;

-- 6. Default privileges for future objects created by the grant issuer (postgres) in each schema.
ALTER DEFAULT PRIVILEGES IN SCHEMA public     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA public     GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA core       GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA core       GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA academics  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA academics  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA files      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA files      GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA payments   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erplake;
ALTER DEFAULT PRIVILEGES IN SCHEMA payments   GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO erplake;

-- 7. Broad DB privileges (optional but convenient for dev).
GRANT ALL PRIVILEGES ON DATABASE schooldb TO erplake;

-- 8. (Optional) Ownership reassignment if you *want* erplake to own objects (commented out – risky in prod).
-- DO $$
-- DECLARE r RECORD;
-- BEGIN
--   FOR r IN SELECT table_schema, table_name FROM information_schema.tables
--            WHERE table_schema IN ('public','core','academics','files','payments') LOOP
--       EXECUTE format('ALTER TABLE %I.%I OWNER TO %I', r.table_schema, r.table_name, 'erplake');
--   END LOOP;
-- END$$;

-- 9. Verification examples (run manually if desired):
-- SELECT 1 FROM academics.class_section LIMIT 1;
-- SELECT current_user;

-- End of grants_full_access.sql
