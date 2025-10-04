"""Migration B: Copy data from public classroom tables into academics schema and create latest_exam_score view

Revision ID: 20251002_2010_acad_copy
Revises: 20251002_2000_acad_schema
Create Date: 2025-10-02
"""
from alembic import op
import sqlalchemy as sa

revision = '20251002_2010_acad_copy'
down_revision = '20251002_2000_acad_schema'
branch_labels = None
depends_on = None

TABLES = [
    'students','wings','school_classes','class_students','attendance_events','fee_invoices','exam_scores','student_tags','class_status','class_teachers'
]

COPY_ORDER = [
    'students','wings','school_classes','class_students','attendance_events','fee_invoices','exam_scores','student_tags','class_status','class_teachers'
]

def upgrade():
    conn = op.get_bind()
    for tbl in COPY_ORDER:
        # Build column list dynamically to avoid mismatch if slight drift
        cols = conn.execute(sa.text(f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=:t ORDER BY ordinal_position"), {'t': tbl}).scalars().all()
        if not cols:
            continue
        col_csv = ','.join(cols)
        insert_cols = ','.join(cols)
        # Use ON CONFLICT DO NOTHING for tables with explicit PKs to avoid duplicates on re-run; rely on natural PK presence
        stmt = f"INSERT INTO academics.{tbl} ({insert_cols}) SELECT {col_csv} FROM public.{tbl} ON CONFLICT DO NOTHING" if tbl not in ('attendance_events','class_students','student_tags') else f"INSERT INTO academics.{tbl} ({insert_cols}) SELECT {col_csv} FROM public.{tbl} ON CONFLICT DO NOTHING"
        conn.execute(sa.text(stmt))
    # Create latest_exam_score view inside academics if not exists
    conn.execute(sa.text("""
        CREATE OR REPLACE VIEW academics.latest_exam_score AS
        SELECT DISTINCT ON (student_id)
            student_id, exam_date, exam_type, total_marks, obtained_marks
        FROM academics.exam_scores
        WHERE exam_type='term'
        ORDER BY student_id, exam_date DESC;
    """))
    # Basic count parity assertion (non-fatal if mismatch, but logged)
    for tbl in COPY_ORDER:
        pub = conn.execute(sa.text(f"SELECT count(*) FROM public.{tbl}")).scalar()
        acad = conn.execute(sa.text(f"SELECT count(*) FROM academics.{tbl}")).scalar()
        if pub != acad:
            op.get_context().impl.output(f"[WARN] Row count mismatch {tbl}: public={pub} academics={acad}")


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP VIEW IF EXISTS academics.latest_exam_score"))
    for tbl in reversed(COPY_ORDER):
        conn.execute(sa.text(f"TRUNCATE academics.{tbl} CASCADE"))
