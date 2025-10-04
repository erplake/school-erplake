-- Native DDL for wings / school_classes / class_students and aggregate view
-- Safe to run multiple times (uses IF NOT EXISTS where possible; recreates view)

CREATE TABLE IF NOT EXISTS wings (
  id            SERIAL PRIMARY KEY,
  academic_year TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  grade_start   INT     NOT NULL,
  grade_end     INT     NOT NULL,
  target_ratio  INT,
  head          TEXT,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_wings_year_name UNIQUE (academic_year, name)
);
CREATE INDEX IF NOT EXISTS ix_wings_academic_year ON wings(academic_year);

CREATE TABLE IF NOT EXISTS school_classes (
  id            SERIAL PRIMARY KEY,
  academic_year TEXT    NOT NULL,
  wing_id       INT REFERENCES wings(id) ON DELETE CASCADE,
  grade         INT     NOT NULL,
  section       TEXT    NOT NULL,
  teacher_name  TEXT,
  target_ratio  INT,
  head_teacher  TEXT,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_school_classes_year_grade_section UNIQUE(academic_year, grade, section)
);
CREATE INDEX IF NOT EXISTS ix_school_classes_year_grade ON school_classes(academic_year, grade);

CREATE TABLE IF NOT EXISTS class_students (
  class_id    INT REFERENCES school_classes(id) ON DELETE CASCADE,
  student_id  INT NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS ix_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS ix_class_students_student_id ON class_students(student_id);

-- Aggregate view (recreate)
DROP VIEW IF EXISTS class_aggregate;
CREATE VIEW class_aggregate AS
SELECT sc.id as class_id,
       sc.academic_year,
       sc.grade,
       sc.section,
       sc.teacher_name,
       sc.target_ratio,
       sc.wing_id,
       COUNT(cs.student_id) AS total_students
  FROM school_classes sc
  LEFT JOIN class_students cs ON cs.class_id = sc.id
 GROUP BY sc.id;

-- End of wings / classes DDL