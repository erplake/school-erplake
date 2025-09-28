from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ...core.security import require
from ...core.db import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import Invoice

router = APIRouter(prefix="/fees", tags=["fees"])

class InvoiceIn(BaseModel):
    student_id: int
    amount_paise: int
    currency: str = "INR"

@router.post("/invoices")
async def create_invoice(inv: InvoiceIn, session: AsyncSession = Depends(get_session), user=Depends(require('fees:create_invoice'))):
    invoice = Invoice(student_id=inv.student_id, amount_paise=inv.amount_paise, currency=inv.currency, status='unpaid')
    session.add(invoice)
    await session.commit()
    await session.refresh(invoice)
    return {"id": invoice.id, "student_id": invoice.student_id, "amount_paise": invoice.amount_paise, "currency": invoice.currency, "status": invoice.status}

@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('fees:view_invoice'))):
    result = await session.execute(select(Invoice).where(Invoice.id==invoice_id))
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    return {"id": invoice.id, "student_id": invoice.student_id, "amount_paise": invoice.amount_paise, "currency": invoice.currency, "status": invoice.status, "created_at": invoice.created_at.isoformat() if invoice.created_at else None}
