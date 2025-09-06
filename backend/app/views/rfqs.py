# app/views/rfqs.py

import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

# Models and DB session
from app.models import (
    Certification as CertificationModel,
    Quote as QuoteModel,
    RFQ as RFQModel,
)
from app.services.database import get_db

# Import the services for LLM extraction and business logic processing
from app.services.llm_client import extract_quote_data_from_email
from app.services.quote_processor import process_quote_from_email_data

router = APIRouter(prefix="/rfqs", tags=["RFQs"])

# --- Pydantic Schemas ---
class CertificationSchema(BaseModel):
    id: str
    name: str
    model_config = ConfigDict(from_attributes=True)

class RFQSchemaBase(BaseModel):
    item: str
    due_date: Optional[datetime.datetime] = None
    amount_required_lbs: Optional[float] = None
    ship_to_location: Optional[str] = None

class RFQSchemaCreate(RFQSchemaBase):
    required_certifications: list[str] = []

class RFQSchema(RFQSchemaBase):
    id: str
    required_certifications: list[CertificationSchema] = []
    model_config = ConfigDict(from_attributes=True)

class SupplierComparisonSchema(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    hq_address: Optional[str] = None
    payment_terms: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class QuoteComparisonSchema(BaseModel):
    id: str
    date_submitted: datetime.datetime
    price_per_pound: Optional[float] = None
    country_of_origin: Optional[str] = None
    min_order_quantity: Optional[int] = None
    certifications: list[CertificationSchema] = []
    supplier: SupplierComparisonSchema  # Nest the detailed supplier schema

    model_config = ConfigDict(from_attributes=True)

class EmailExtractRequest(BaseModel):
    """Schema for the incoming request body."""
    raw_text: str = Field(..., description="The raw text content of the supplier's email.")

class RFQEmailResponse(BaseModel):
    """Schema for the successful response, returning the new/updated quote."""
    id: str
    supplier_id: str
    rfq_id: str
    price_per_pound: Optional[float] = None
    country_of_origin: Optional[str] = None
    min_order_quantity: Optional[int] = None
    certifications: list[CertificationSchema] = []
    model_config = ConfigDict(from_attributes=True)


# --- Standard CRUD Endpoints ---

@router.post("", response_model=RFQSchema, status_code=201)
async def create_rfq(rfq_in: RFQSchemaCreate, db: AsyncSession = Depends(get_db)):
    """Create a new RFQ."""
    rfq_data = rfq_in.model_dump(exclude={"required_certifications"})

    # ... (certification handling logic is unchanged)
    final_certs = []
    if rfq_in.required_certifications:
        existing_certs = await CertificationModel.find_by_names(db, rfq_in.required_certifications)
        existing_cert_names = {c.name for c in existing_certs}
        final_certs.extend(existing_certs)
        new_cert_names = set(rfq_in.required_certifications) - existing_cert_names
        for name in new_cert_names:
            new_cert = CertificationModel(name=name)
            db.add(new_cert)
            final_certs.append(new_cert)
    
    new_rfq = RFQModel(**rfq_data)
    new_rfq.required_certifications = final_certs
    
    db.add(new_rfq)
    await db.commit()
    await db.refresh(new_rfq) 

    query = (
        select(RFQModel)
        .options(selectinload(RFQModel.required_certifications))
        .where(RFQModel.id == new_rfq.id)
    )
    result = await db.execute(query)
    rfq_with_relationships = result.scalars().first()

    return RFQSchema.model_validate(rfq_with_relationships)

@router.get("", response_model=list[RFQSchema])
async def get_rfqs(db: AsyncSession = Depends(get_db)):
    """Retrieve all RFQs."""
    return await RFQModel.get_all(db)

@router.get("/{rfq_id}/quotes", response_model=list[QuoteComparisonSchema])
async def get_quotes_for_rfq(rfq_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve all quotes submitted for a specific RFQ."""
    rfq = await db.get(RFQModel, rfq_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return await QuoteModel.get_by_rfq_id(db, rfq_id=rfq_id)

# --- Optimized LLM-driven Endpoint ---
@router.post("/{rfq_id}/extract-quote-from-email", response_model=RFQEmailResponse)
async def extract_and_save_quote(
    rfq_id: str,
    request: EmailExtractRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Extracts quote data from an email, processes it, and persists it to the database.
    This endpoint coordinates calls to the LLM service and the data processing service.
    """
    # 1. Verify RFQ exists
    rfq = await db.get(RFQModel, rfq_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    # 2. Call the LLM service to get structured data
    extracted_data = await extract_quote_data_from_email(request.raw_text)
    
    # 3. Call the business logic service to handle the database transaction
    try:
        quote = await process_quote_from_email_data(
            db=db,
            rfq_id=rfq.id,
            rfq_item_name=rfq.item,
            extracted_data=extracted_data,
            raw_text=request.raw_text
        )
        
        await db.commit()

        await db.refresh(quote, ["supplier", "certifications"])
        
        response_data = RFQEmailResponse.model_validate(quote)
        return response_data
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        # Log the full error for debugging on the server
        print(f"An unexpected database transaction error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while saving the quote.")