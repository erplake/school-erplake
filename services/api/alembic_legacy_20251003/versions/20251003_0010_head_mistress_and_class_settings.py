"""Head mistress table, wing head_id FK, storage/meet columns

Revision ID: 20251003_0010_head_mistress_and_class_settings
Revises: 20251003_0001_grade_text_migration
Create Date: 2025-10-03
"""
from alembic import op
import sqlalchemy as sa

revision = '20251003_0010_head_mistress_and_class_settings'
down_revision = '20251003_0001_grade_text_migration'
branch_labels = None
depends_on = None

def upgrade():
    # head_mistress table
    op.create_table(
        'head_mistress',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    # wing head_id (nullable) + index
    op.add_column('wings', sa.Column('head_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_wings_head_id', 'wings', 'head_mistress', ['head_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_wings_head_id', 'wings', ['head_id'])

    # school_classes storage_path / meet_link columns
    op.add_column('school_classes', sa.Column('storage_path', sa.Text(), nullable=True))
    op.add_column('school_classes', sa.Column('meet_link', sa.Text(), nullable=True))

    # Backfill existing storage/meet basic defaults (optional, safe best-effort)
    conn = op.get_bind()
    try:
        conn.execute(sa.text("""
            update school_classes set storage_path = concat('/classes/', grade, '-', section)
            where storage_path is null;
        """))
        conn.execute(sa.text("""
            update school_classes set meet_link = concat('https://meet.google.com/lookup/', grade, section, id::text)
            where meet_link is null;
        """))
    except Exception as e:
        print('[warn] backfill storage/meet failed', e)


def downgrade():
    # Remove new columns/tables (order matters)
    op.drop_column('school_classes', 'meet_link')
    op.drop_column('school_classes', 'storage_path')

    op.drop_index('ix_wings_head_id', table_name='wings')
    op.drop_constraint('fk_wings_head_id', 'wings', type_='foreignkey')
    op.drop_column('wings', 'head_id')

    op.drop_table('head_mistress')
