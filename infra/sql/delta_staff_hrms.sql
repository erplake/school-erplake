-- HRMS delta: add employee_id and emergency contact fields to staff table
-- Idempotent guards (Postgres 9.6+ compatible)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='employee_id'
    ) THEN
        ALTER TABLE staff ADD COLUMN employee_id VARCHAR(30) UNIQUE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='emergency_contact_name'
    ) THEN
        ALTER TABLE staff ADD COLUMN emergency_contact_name VARCHAR(120);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='emergency_contact_relation'
    ) THEN
        ALTER TABLE staff ADD COLUMN emergency_contact_relation VARCHAR(60);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='emergency_contact_phone'
    ) THEN
        ALTER TABLE staff ADD COLUMN emergency_contact_phone VARCHAR(40);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='emergency_contact_address'
    ) THEN
        ALTER TABLE staff ADD COLUMN emergency_contact_address VARCHAR(255);
    END IF;
END $$;
