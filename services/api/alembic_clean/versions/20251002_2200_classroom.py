"""Create classroom management tables (wings, school_classes, class_students)

Short revision id (<=32) to satisfy alembic_version column length.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251002_2200_classroom"
down_revision = "20251002_2100_baseline"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS wings (
          id SERIAL PRIMARY KEY,
          academic_year TEXT NOT NULL,
          name TEXT NOT NULL,
          grade_start INT NOT NULL,
          grade_end INT NOT NULL,
          target_ratio INT,
          head TEXT,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL,
          CONSTRAINT uq_wings_year_name UNIQUE (academic_year, name)
        );
        CREATE INDEX IF NOT EXISTS ix_wings_academic_year ON wings(academic_year);
        """
    ))
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS school_classes (
          id SERIAL PRIMARY KEY,
          academic_year TEXT NOT NULL,
          wing_id INT REFERENCES wings(id) ON DELETE CASCADE,
          grade INT NOT NULL,
          section TEXT NOT NULL,
          teacher_name TEXT,
          target_ratio INT,
          head_teacher TEXT,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL,
          CONSTRAINT uq_school_classes_year_grade_section UNIQUE(academic_year, grade, section)
        );
        CREATE INDEX IF NOT EXISTS ix_school_classes_year_grade ON school_classes(academic_year, grade);
        """
    ))
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS class_students (
          class_id INT REFERENCES school_classes(id) ON DELETE CASCADE,
          student_id INT NOT NULL,
          assigned_at timestamptz DEFAULT now() NOT NULL,
          PRIMARY KEY (class_id, student_id)
        );
        CREATE INDEX IF NOT EXISTS ix_class_students_class_id ON class_students(class_id);
        CREATE INDEX IF NOT EXISTS ix_class_students_student_id ON class_students(student_id);
        """
    ))
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS attendance_events (
          id SERIAL PRIMARY KEY,
          student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          present INT NOT NULL,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL,
          CONSTRAINT uq_attendance_event_student_date UNIQUE(student_id,date)
        );
        CREATE INDEX IF NOT EXISTS ix_attendance_events_student_id ON attendance_events(student_id);
        CREATE INDEX IF NOT EXISTS ix_attendance_events_date ON attendance_events(date);
        """
    ))
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS fee_invoices (
          id SERIAL PRIMARY KEY,
          student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          amount INT NOT NULL,
          paid_amount INT DEFAULT 0 NOT NULL,
          due_date DATE,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL,
          settled_at timestamptz
        );
        CREATE INDEX IF NOT EXISTS ix_fee_invoices_student_id ON fee_invoices(student_id);
        """
    ))


def downgrade():
    raise RuntimeError("Downgrade not supported for classroom tables (data preservation)")
