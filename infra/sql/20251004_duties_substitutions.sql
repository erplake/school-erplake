-- Migration: Add staff duties and substitutions tables
-- Date: 2025-10-04

CREATE TABLE IF NOT EXISTS staff_duties (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  duty_date DATE NOT NULL,
  notes VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_duties_date ON staff_duties(duty_date DESC);

CREATE TABLE IF NOT EXISTS staff_substitutions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  absent_staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  substitute_staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  periods VARCHAR(60) NOT NULL,
  notes VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_substitutions_date ON staff_substitutions(date DESC);
