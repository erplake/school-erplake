-- Migration: Add resignation tracking columns & staff_announcements table
-- Date: 2025-10-04
-- Idempotent-ish guards are minimal; ensure you run this only once or add proper checks in your migration framework.

-- 1. Add columns to staff (nullable so it won't fail existing rows)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS resignation_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS resignation_reason VARCHAR(255);

-- 2. Create staff_announcements table
CREATE TABLE IF NOT EXISTS staff_announcements (
  id SERIAL PRIMARY KEY,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional future index (if filtering or time-range queries become common)
-- CREATE INDEX IF NOT EXISTS idx_staff_announcements_created_at ON staff_announcements(created_at DESC);

-- Rollback (manual):
-- ALTER TABLE staff DROP COLUMN resignation_date;
-- ALTER TABLE staff DROP COLUMN resignation_reason;
-- DROP TABLE staff_announcements;
