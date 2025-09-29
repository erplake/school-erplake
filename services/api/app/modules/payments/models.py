from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text, Integer, JSON, Index, Date
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base

class PgTransaction(Base):
    __tablename__ = 'pg_transaction'
    __table_args__ = (
        Index('ix_pg_tx_school_provider_order', 'school_id', 'provider', 'order_id'),
        Index('ix_pg_tx_school_payment', 'school_id', 'payment_id'),
        Index('ix_pg_tx_invoice', 'invoice_id'),
        {'schema': 'payments'}
    )
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    school_id: Mapped[int] = mapped_column(ForeignKey('core.school.id', ondelete='CASCADE'))
    provider: Mapped[str] = mapped_column(String)
    order_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    payment_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    refund_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default='CREATED')
    amount: Mapped[float] = mapped_column(Numeric(12,2))
    currency: Mapped[str] = mapped_column(String, default='INR')
    fee: Mapped[Optional[float]] = mapped_column(Numeric(12,2), nullable=True)
    tax: Mapped[Optional[float]] = mapped_column(Numeric(12,2), nullable=True)
    invoice_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # soft link to fees.invoice (legacy public)
    raw: Mapped[dict] = mapped_column(JSON, default=dict)  # store provider payload
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    settled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

class ReconLedger(Base):
    __tablename__ = 'recon_ledger'
    __table_args__ = (
        Index('ix_recon_pg_tx', 'pg_transaction_id'),
        {'schema': 'payments'}
    )
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pg_transaction_id: Mapped[Optional[int]] = mapped_column(ForeignKey('payments.pg_transaction.id', ondelete='CASCADE'), nullable=True)
    invoice_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # soft link
    step: Mapped[str] = mapped_column(String)
    delta: Mapped[float] = mapped_column(Numeric(12,2), default=0)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class PaymentEvent(Base):
    """Raw inbound webhook or payment lifecycle event.

    We deliberately keep provider-agnostic shape & store original payload for
    replay / debugging. Transaction linkage is best-effort via order/payment/refund IDs.
    """
    __tablename__ = 'payment_event'
    __table_args__ = (
        Index('uq_payment_event_provider_event_id', 'school_id', 'provider', 'event_id', unique=True, postgresql_where=None),
        {'schema': 'payments'}
    )
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    school_id: Mapped[int] = mapped_column(ForeignKey('core.school.id', ondelete='CASCADE'))
    provider: Mapped[str] = mapped_column(String)
    event_id: Mapped[str] = mapped_column(String)  # provider's idempotency key / event id
    event_type: Mapped[str] = mapped_column(String)
    pg_transaction_id: Mapped[Optional[int]] = mapped_column(ForeignKey('payments.pg_transaction.id', ondelete='SET NULL'), nullable=True)
    status_derived: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    raw: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class SettlementSummary(Base):
    __tablename__ = 'settlement_summary'
    __table_args__ = (
        Index('uq_settlement_day', 'school_id','provider','settlement_date', unique=True),
        {'schema': 'payments'}
    )
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    school_id: Mapped[int] = mapped_column(ForeignKey('core.school.id', ondelete='CASCADE'))
    provider: Mapped[str] = mapped_column(String)
    settlement_date: Mapped[datetime] = mapped_column(Date)
    currency: Mapped[str] = mapped_column(String, default='INR')
    gross_amount: Mapped[float] = mapped_column(Numeric(14,2), default=0)
    fees_amount: Mapped[float] = mapped_column(Numeric(14,2), default=0)
    refunds_amount: Mapped[float] = mapped_column(Numeric(14,2), default=0)
    net_amount: Mapped[float] = mapped_column(Numeric(14,2), default=0)
    tx_count: Mapped[int] = mapped_column(Integer, default=0)
    refund_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
