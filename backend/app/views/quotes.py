# /Users/duncan/dev/personal-projects/waystation/backend/app/views/quotes.py
import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Quote as QuoteModel
from app.models import RFQ as RFQModel
from app.services.database import get_db
from app.services.llm_client import generate_clarification_email
from app.views.rfqs import CertificationSchema, SupplierComparisonSchema

router = APIRouter(prefix="/quotes", tags=["Quotes"])


class RFQInfoSchema(BaseModel):
    """Minimal RFQ information to nest inside a quote response."""

    id: str
    item: str
    model_config = ConfigDict(from_attributes=True)


class QuoteWithDetailsSchema(BaseModel):
    """Schema for returning a quote with all its related details."""

    id: str
    date_submitted: datetime.datetime
    price_per_pound: Optional[float] = None
    country_of_origin: Optional[str] = None
    min_order_quantity: Optional[int] = None
    certifications: list[CertificationSchema] = []
    supplier: SupplierComparisonSchema
    rfq: RFQInfoSchema
    model_config = ConfigDict(from_attributes=True)


class ClarificationEmailResponse(BaseModel):
    """Schema for the clarification email response."""

    email_text: str


@router.get("", response_model=list[QuoteWithDetailsSchema])
async def get_all_quotes(db: AsyncSession = Depends(get_db)):
    """
    Retrieve a list of all quotes, including their associated supplier,
    certifications, and RFQ details, for a master list view.
    """
    query = (
        select(QuoteModel)
        .options(
            selectinload(QuoteModel.supplier),
            selectinload(QuoteModel.certifications),
            selectinload(QuoteModel.rfq),
        )
        .order_by(QuoteModel.date_submitted.desc())
    )
    result = await db.execute(query)
    quotes = result.scalars().all()
    return quotes


@router.post("/{quote_id}/generate-clarification-email", response_model=ClarificationEmailResponse)
async def generate_quote_clarification_email(quote_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generates an email to a supplier requesting missing information
    by comparing the Quote against its RFQ.
    """
    query = (
        select(QuoteModel)
        .where(QuoteModel.id == quote_id)
        .options(
            selectinload(QuoteModel.supplier),
            selectinload(QuoteModel.certifications),
            selectinload(QuoteModel.rfq).selectinload(RFQModel.required_certifications),
        )
    )
    result = await db.execute(query)
    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    missing_items = []

    # Check for missing fields on the quote
    if quote.price_per_pound is None:
        missing_items.append("Price per pound")
    if quote.country_of_origin is None:
        missing_items.append("Country of origin")
    if quote.min_order_quantity is None:
        missing_items.append("Minimum order quantity")

    # Compare certifications
    quote_cert_names = {cert.name for cert in quote.certifications}
    required_cert_names = {cert.name for cert in quote.rfq.required_certifications}

    missing_certs = required_cert_names - quote_cert_names
    for cert_name in sorted(list(missing_certs)):
        missing_items.append(f"Missing Certification: {cert_name}")

    if not missing_items:
        raise HTTPException(status_code=400, detail="No missing information found to request.")

    # Construct the prompt for the LLM
    prompt = f"""
    You are a polite and professional procurement assistant. Your task is to draft an email to a supplier to request missing information from their recent quote.

    **Context:**
    - We sent out a Request for Quote (RFQ) for the item: "{quote.rfq.item}".
    - The supplier, {quote.supplier.company_name}, has responded with a partial quote.
    - We need to contact: {quote.supplier.contact_name or 'the sales team'}.

    **Task:**
    Write a concise and friendly email requesting the following missing information:
    - {', '.join(missing_items)}

    The email should be addressed to {quote.supplier.contact_name or 'the team at ' + quote.supplier.company_name} and should be ready to send. Keep it brief and to the point. Start the email with a greeting and end with a professional closing. Do not include a subject line.
    """

    # Call the LLM service
    try:
        generated_email = await generate_clarification_email(prompt)
        return ClarificationEmailResponse(email_text=generated_email)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate email: {str(e)}")