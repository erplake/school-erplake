-- Delta: staff duties table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name='staff_duties'
    ) THEN
        CREATE TABLE staff_duties (
            id SERIAL PRIMARY KEY,
            staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
            title VARCHAR(120) NOT NULL,
            duty_date DATE NOT NULL,
            notes VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX idx_staff_duties_staff_id ON staff_duties(staff_id);
        CREATE INDEX idx_staff_duties_duty_date ON staff_duties(duty_date);
    END IF;
END $$;