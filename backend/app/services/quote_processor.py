# app/services/quote_processor.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

# Import your data schemas and database models
from app.services.llm_client import ExtractedDataSchema
from app.models import (
    Supplier as SupplierModel,
    Certification as CertificationModel,
    Quote as QuoteModel,
    Email as EmailModel,
    RFQ as RFQModel
)

async def process_quote_from_email_data(
    db: AsyncSession,
    rfq_id: str,
    rfq_item_name: str,
    extracted_data: ExtractedDataSchema,
    raw_text: str
) -> QuoteModel:
    """
    Handles the business logic of finding/creating records based on LLM output.
    This function contains all the database logic that was previously in the view.
    """
    try:
        # A. Handle Supplier: Find or Create
        supplier = None
        if extracted_data.supplier_email:
            supplier_result = await db.execute(
                select(SupplierModel).where(SupplierModel.contact_email == extracted_data.supplier_email)
            )
            supplier = supplier_result.scalar_one_or_none()
        
        if not supplier and extracted_data.supplier_email:
            # Use the extracted company name, or create a UNIQUE placeholder as a fallback.
            company_name_to_use = extracted_data.company_name or f"Supplier ({extracted_data.supplier_email})"
            
            supplier = SupplierModel(
                company_name=company_name_to_use,
                contact_name=extracted_data.contact_name,
                contact_email=extracted_data.supplier_email,
                contact_phone=extracted_data.supplier_phone
            )
            db.add(supplier)
            await db.flush()  # Ensures supplier.id is available for the quote
        
        if not supplier:
            # The service layer should raise exceptions that the view layer can catch.
            raise ValueError("Could not identify a supplier email in the text.")

        # B. Handle Certifications: Find or Create
        quote_certs = []
        if extracted_data.certifications:
            existing_certs = await CertificationModel.find_by_names(db, extracted_data.certifications)
            cert_map = {cert.name: cert for cert in existing_certs}
            
            for cert_name in extracted_data.certifications:
                if cert_name not in cert_map:
                    new_cert = CertificationModel(name=cert_name)
                    db.add(new_cert)
                    quote_certs.append(new_cert)
                else:
                    quote_certs.append(cert_map[cert_name])

        # C. Handle Quote: Find and Update, or Create
        quote_result = await db.execute(
            select(QuoteModel).where(QuoteModel.rfq_id == rfq_id, QuoteModel.supplier_id == supplier.id)
        )
        quote = quote_result.scalar_one_or_none()
        
        quote_data_dict = {
            "price_per_pound": extracted_data.price_per_pound,
            "country_of_origin": extracted_data.country_of_origin,
            "min_order_quantity": extracted_data.minimum_order_quantity,
        }

        if quote:  # Update existing quote
            for key, value in quote_data_dict.items():
                if value is not None:
                    setattr(quote, key, value)
            quote.certifications = quote_certs
        else:  # Create new quote
            quote = QuoteModel(
                rfq_id=rfq_id,
                supplier_id=supplier.id,
                certifications=quote_certs,
                **quote_data_dict
            )
            db.add(quote)
            # Flush the session to get the new quote's ID from the DB
            await db.flush()

        # D. Log the raw email and link it to the quote
        email_log = EmailModel(
            raw_text=raw_text,
            quote=quote,
            extracted_data=extracted_data.model_dump()
        )
        db.add(email_log)

        # The commit will be handled by the endpoint context to ensure atomicity
        return quote

    except Exception as e:
        # Re-raise exceptions to be handled by the endpoint's try/except block
        raise e