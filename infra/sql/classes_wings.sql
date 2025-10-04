-- Schema for Wings & Classes Management
-- This file is a reference; integrate via Alembic migration for production.

-- WINGS: groups of grades for an academic year
CREATE TABLE IF NOT EXISTS wings (
    id SERIAL PRIMARY KEY,
    academic_year TEXT NOT NULL,
    name TEXT NOT NULL,
    grade_start INT NOT NULL CHECK (grade_start >=1 AND grade_start <=12),
    grade_end INT NOT NULL CHECK (grade_end >= grade_start AND grade_end <=12),
    target_ratio INT, -- desired students per teacher (1:target_ratio)
    head TEXT, -- headmistress / wing head
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wings_year_name ON wings(academic_year, name);

-- CLASSES: specific grade + section within an academic year & wing
CREATE TABLE IF NOT EXISTS school_classes (
    id SERIAL PRIMARY KEY,
    academic_year TEXT NOT NULL,
    wing_id INT REFERENCES wings(id) ON DELETE CASCADE,
    grade INT NOT NULL CHECK (grade >=1 AND grade <=12),
    section TEXT NOT NULL CHECK (char_length(section) <= 2),
    teacher_name TEXT,
    target_ratio INT, -- overrides wing target if set
    head_teacher TEXT, -- optional future use
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (academic_year, grade, section)
);
CREATE INDEX IF NOT EXISTS idx_school_classes_wing ON school_classes(wing_id);

-- CLASS STUDENTS: mapping of students into a class for a given academic year
CREATE TABLE IF NOT EXISTS class_students (
    class_id INT REFERENCES school_classes(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

-- VIEW: class_aggregate to accelerate counts (optional)
CREATE OR REPLACE VIEW class_aggregate AS
SELECT c.id as class_id,
       c.academic_year,
       c.grade,
       c.section,
       c.teacher_name,
       c.target_ratio,
       w.name as wing_name,
       w.target_ratio as wing_target_ratio,
       COUNT(cs.student_id) AS total_students
FROM school_classes c
LEFT JOIN wings w ON w.id = c.wing_id
LEFT JOIN class_students cs ON cs.class_id = c.id
GROUP BY c.id, w.name, w.target_ratio;
