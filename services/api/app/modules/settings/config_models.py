from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, BigInteger, Text, Boolean, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from app.core import crypto
from app.core.db import Base


class ConfigEntry(Base):
    __tablename__ = 'config'
    __table_args__ = (
        UniqueConstraint('school_id','key', name='uq_config_school_key'),
        Index('ix_config_school_key', 'school_id','key'),
        {'schema': 'settings'}
    )
    id = Column(BigInteger, primary_key=True)
    school_id = Column(BigInteger, ForeignKey('core.school.id', ondelete='CASCADE'), nullable=False, default=1)
    key = Column(Text, nullable=False)
    value_json = Column(JSONB, nullable=False, default=dict)
    is_secret = Column(Boolean, nullable=False, default=False)
    updated_by = Column(BigInteger, ForeignKey('core.user_account.id', ondelete='SET NULL'))
    updated_at = Column(DateTime(timezone=True))


class IntegrationCredential(Base):
    __tablename__ = 'integration_credential'
    __table_args__ = { 'schema': 'settings' }
    id = Column(BigInteger, primary_key=True)
    school_id = Column(BigInteger, ForeignKey('core.school.id', ondelete='CASCADE'), nullable=False, default=1)
    provider = Column(Text, nullable=False)
    label = Column(Text, nullable=True)
    credentials_enc = Column('credentials_enc',  Text, nullable=False)  # encrypted or plaintext tagged value
    rotated_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True))

    # Simple encode/decode helpers (placeholder for real encryption at rest)
    @staticmethod
    def encode_credentials(obj: dict) -> str:
        return crypto.encrypt_dict(obj)

    @staticmethod
    def decode_credentials(value: str) -> dict:
        return crypto.decrypt_dict(value)