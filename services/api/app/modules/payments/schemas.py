from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class PgTransactionCreate(BaseModel):
    provider: str
    amount: float
    currency: str = 'INR'
    order_id: Optional[str] = None
    payment_id: Optional[str] = None
    refund_id: Optional[str] = None
    invoice_id: Optional[int] = None
    raw: Optional[dict] = None

class PgTransactionOut(BaseModel):
    id: int
    provider: str
    status: str
    amount: float
    currency: str
    order_id: Optional[str]
    payment_id: Optional[str]
    refund_id: Optional[str]
    invoice_id: Optional[int]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReconEntryCreate(BaseModel):
    pg_transaction_id: int
    step: str
    delta: float = 0
    note: Optional[str] = None
    invoice_id: Optional[int] = None

class ReconEntryOut(BaseModel):
    id: int
    pg_transaction_id: Optional[int]
    invoice_id: Optional[int]
    step: str
    delta: float
    note: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaymentEventIn(BaseModel):
    provider: str
    event_id: str
    event_type: str
    order_id: Optional[str] = None
    payment_id: Optional[str] = None
    refund_id: Optional[str] = None
    raw: dict


class PaymentEventOut(BaseModel):
    id: int
    provider: str
    event_id: str
    event_type: str
    status_derived: Optional[str]
    pg_transaction_id: Optional[int]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SettlementSummaryOut(BaseModel):
    id: int
    provider: str
    settlement_date: date
    currency: str
    gross_amount: float
    fees_amount: float
    refunds_amount: float
    net_amount: float
    tx_count: int
    refund_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
