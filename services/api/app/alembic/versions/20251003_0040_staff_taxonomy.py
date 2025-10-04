"""staff taxonomy tables and photo_url column

Revision ID: 20251003_0040_staff_taxonomy
Revises: 20251003_0035_merge_staff_heads
Create Date: 2025-10-03
"""
from alembic import op
import sqlalchemy as sa

revision = '20251003_0040_staff_taxonomy'
down_revision = '20251003_0035_merge_staff_heads'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    existing_cols = [r[0] for r in conn.execute(sa.text("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='staff'
    """))]
    if 'photo_url' not in existing_cols:
        op.add_column('staff', sa.Column('photo_url', sa.String(length=300), nullable=True))

    if not op.get_bind().dialect.has_table(conn, 'staff_roles'):
        op.create_table(
            'staff_roles',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String(length=80), nullable=False, unique=True),
            sa.Column('active', sa.Boolean, nullable=False, server_default=sa.text('true')),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        )
    if not op.get_bind().dialect.has_table(conn, 'staff_departments'):
        op.create_table(
            'staff_departments',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String(length=120), nullable=False, unique=True),
            sa.Column('active', sa.Boolean, nullable=False, server_default=sa.text('true')),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        )

    roles = ['Teacher','Principal','Admin','Accountant','Librarian','Counselor']
    for r in roles:
        conn.execute(sa.text("INSERT INTO staff_roles (name) VALUES (:n) ON CONFLICT (name) DO NOTHING"), {"n": r})
    depts = ['Mathematics','Science','English','Humanities','Sports','Administration','Finance']
    for d in depts:
        conn.execute(sa.text("INSERT INTO staff_departments (name) VALUES (:n) ON CONFLICT (name) DO NOTHING"), {"n": d})

    conn.execute(sa.text("""
    CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END; $$ LANGUAGE plpgsql;
    """))
    for tbl, trg in [('staff_roles','trg_staff_roles_updated_at'), ('staff_departments','trg_staff_departments_updated_at')]:
        conn.execute(sa.text(f"""
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '{trg}') THEN
            CREATE TRIGGER {trg}
            BEFORE UPDATE ON {tbl}
            FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
          END IF;
        END $$;
        """))


def downgrade():
    op.drop_table('staff_departments')
    op.drop_table('staff_roles')
    conn = op.get_bind()
    existing_cols = [r[0] for r in conn.execute(sa.text("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='staff'
    """))]
    if 'photo_url' in existing_cols:
        op.drop_column('staff', 'photo_url')
