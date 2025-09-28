from __future__ import annotations
"""Lightweight ORM models for existing tables that previously lacked SQLAlchemy models.
These are kept separate to avoid circular imports with domain modules.

NOTE: Migrations created these tables originally; fields reflect initial schema.
"""
from sqlalchemy import Column, Integer, String, DateTime, BigInteger, Boolean, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import text
from app.core.db import Base

class FeeHead(Base):
    __tablename__ = 'fee_heads'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    active = Column(Boolean, server_default=text('true'))

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id', ondelete='CASCADE'), index=True)
    provider = Column(String, nullable=False)
    provider_payment_id = Column(String)
    amount_paise = Column(BigInteger, nullable=False)
    status = Column(String, nullable=False)
    payload = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))
    invoice = relationship('Invoice', backref='payments', lazy='joined')

class AIOutput(Base):
    __tablename__ = 'ai_outputs'
    id = Column(Integer, primary_key=True)
    template_id = Column(String)
    model_id = Column(String)
    input_hash = Column(String)
    reviewer_id = Column(Integer)
    status = Column(String, nullable=False, server_default=text("'pending'"))
    text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))

class AuditLog(Base):
    __tablename__ = 'audit_log'
    id = Column(Integer, primary_key=True)
    actor = Column(String)
    action = Column(String)
    entity = Column(String)
    entity_id = Column(String)
    meta = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))

class IdempotencyKey(Base):
    __tablename__ = 'idempotency_keys'
    id = Column(Integer, primary_key=True)
    key = Column(String, nullable=False, unique=True)
    route = Column(String, nullable=False)
    method = Column(String, nullable=False)
    request_hash = Column(String, nullable=False)
    response_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))

class RefreshToken(Base):
    __tablename__ = 'refresh_tokens'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))
    user = relationship('User', lazy='joined')
