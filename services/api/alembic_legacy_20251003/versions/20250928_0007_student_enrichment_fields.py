"""student enrichment denormalized fields

Revision ID: 20250928_0007
Revises: 20250928_0006
Create Date: 2025-09-28 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20250928_0007'
down_revision: Union[str, None] = '20250928_0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('students') as b:
        b.add_column(sa.Column('attendance_pct', sa.Integer(), nullable=True))
        b.add_column(sa.Column('fee_due_amount', sa.Integer(), nullable=True))
        b.add_column(sa.Column('transport', sa.JSON(), nullable=True))
        b.add_column(sa.Column('tags', sa.String(), nullable=True))
        b.add_column(sa.Column('absent_today', sa.Integer(), nullable=True))
        b.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('students') as b:
        b.drop_column('updated_at')
        b.drop_column('absent_today')
        b.drop_column('tags')
        b.drop_column('transport')
        b.drop_column('fee_due_amount')
        b.drop_column('attendance_pct')
