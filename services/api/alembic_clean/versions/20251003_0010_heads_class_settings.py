"""Head mistress table, wing head_id FK, storage/meet columns (clean chain)

Revision ID: 20251003_0010_heads_class_settings
Revises: 20251003_0001_grade_text
Create Date: 2025-10-03

Mirrors logic from legacy alembic version 20251003_0010_head_mistress_and_class_settings
with shortened revision id for the clean linear lineage.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0010_heads_class_settings"
down_revision = "20251003_0001_grade_text"
branch_labels = None
depends_on = None


def upgrade():
    # head_mistress table
    op.create_table(
        "head_mistress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # wing head_id (nullable) + index/FK
    op.add_column("wings", sa.Column("head_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_wings_head_id", "wings", "head_mistress", ["head_id"], ["id"], ondelete="SET NULL"
    )
    op.create_index("ix_wings_head_id", "wings", ["head_id"])

    # school_classes storage_path / meet_link columns
    op.add_column("school_classes", sa.Column("storage_path", sa.Text(), nullable=True))
    op.add_column("school_classes", sa.Column("meet_link", sa.Text(), nullable=True))

    # Backfill existing storage/meet basic defaults (best-effort)
    conn = op.get_bind()
    try:
        conn.execute(
            sa.text(
                """
                UPDATE school_classes SET storage_path = CONCAT('/classes/', grade, '-', section)
                WHERE storage_path IS NULL;
                """
            )
        )
        conn.execute(
            sa.text(
                """
                UPDATE school_classes SET meet_link = CONCAT('https://meet.google.com/lookup/', grade, section, id::text)
                WHERE meet_link IS NULL;
                """
            )
        )
    except Exception as e:  # pragma: no cover
        print("[warn] backfill storage/meet failed", e)


def downgrade():
    # Remove new columns/tables (order matters)
    op.drop_column("school_classes", "meet_link")
    op.drop_column("school_classes", "storage_path")
    op.drop_index("ix_wings_head_id", table_name="wings")
    op.drop_constraint("fk_wings_head_id", "wings", type_="foreignkey")
    op.drop_column("wings", "head_id")
    op.drop_table("head_mistress")
