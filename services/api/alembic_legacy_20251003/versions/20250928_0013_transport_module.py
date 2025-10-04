"""transport module tables

Revision ID: 20250928_0013
Revises: 20250928_0012
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa

revision = '20250928_0013'
down_revision = '20250928_0012'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'transport_buses',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('code', sa.String(40), nullable=False, unique=True),
        sa.Column('model', sa.String(120), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('driver_staff_id', sa.Integer(), nullable=True),
        sa.Column('route_name', sa.String(120), nullable=True),
        sa.Column('status', sa.String(30), nullable=False, server_default='Idle'),
        sa.Column('last_service_date', sa.Date(), nullable=True),
        sa.Column('service_interval_days', sa.Integer(), nullable=True, server_default='180'),
        sa.Column('odometer_km', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('insurance_expiry', sa.Date(), nullable=True),
        sa.Column('permit_expiry', sa.Date(), nullable=True),
        sa.Column('fitness_expiry', sa.Date(), nullable=True),
        sa.Column('puc_expiry', sa.Date(), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    op.create_table(
        'transport_service_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('bus_id', sa.Integer(), sa.ForeignKey('transport_buses.id', ondelete='CASCADE'), index=True, nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('odometer_km', sa.Integer(), nullable=True),
        sa.Column('work', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'transport_incidents',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('bus_id', sa.Integer(), sa.ForeignKey('transport_buses.id', ondelete='CASCADE'), index=True, nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('note', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'transport_gps_pings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('bus_id', sa.Integer(), sa.ForeignKey('transport_buses.id', ondelete='CASCADE'), index=True, nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('speed_kph', sa.Float(), nullable=True),
        sa.Column('pinged_at', sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )


def downgrade():
    op.drop_table('transport_gps_pings')
    op.drop_table('transport_incidents')
    op.drop_table('transport_service_logs')
    op.drop_table('transport_buses')
