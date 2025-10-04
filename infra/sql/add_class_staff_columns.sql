-- Add missing staff linkage columns to school_classes (idempotent)
ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS teacher_staff_id integer;
ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS assistant_teacher_id integer;
ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS support_staff_ids text;
