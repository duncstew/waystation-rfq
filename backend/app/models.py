# app/models.py

from __future__ import annotations

import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
    select,
)
from sqlalchemy.dialects.postgresql import JSONB  # For storing structured LLM output
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship, selectinload

from app.services.database import Base


def generate_uuid():
    return uuid4().hex

# Association table for RFQ -> Certification (Many-to-Many)
rfq_certification_association = Table(
    'rfq_certifications', Base.metadata,
    Column('rfq_id', String, ForeignKey('rfqs.id'), primary_key=True),
    Column('certification_id', String, ForeignKey('certifications.id'), primary_key=True)
)

# Association table for Quote -> Certification (Many-to-Many)
quote_certification_association = Table(
    'quote_certifications', Base.metadata,
    Column('quote_id', String, ForeignKey('quotes.id'), primary_key=True),
    Column('certification_id', String, ForeignKey('certifications.id'), primary_key=True)
)

class Certification(Base):
    __tablename__ = "certifications"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True)

    @classmethod
    async def find_by_names(cls, db: AsyncSession, names: list[str]) -> list[Certification]:
        """Finds certification records by a list of names."""
        if not names:
            return []
        result = await db.execute(select(cls).where(cls.name.in_(names)))
        return result.scalars().all()

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(String, primary_key=True, default=generate_uuid)
    company_name = Column(String, nullable=False, unique=True)
    contact_name = Column(String)
    contact_email = Column(String, nullable=False, unique=True)
    contact_phone = Column(String)
    hq_address = Column(String)
    payment_terms = Column(String)
    
    quotes = relationship("Quote", back_populates="supplier")

    @classmethod
    async def create(cls, db: AsyncSession, **kwargs) -> Supplier:
        supplier = cls(**kwargs)
        db.add(supplier)
        await db.commit()
        await db.refresh(supplier)
        return supplier

    @classmethod
    async def get(cls, db: AsyncSession, id: str) -> Supplier | None:
        return await db.get(cls, id)

    @classmethod
    async def get_all(cls, db: AsyncSession) -> list[Supplier]:
        return (await db.execute(select(cls))).scalars().all()
    
    @classmethod
    async def update(cls, db: AsyncSession, id: str, **kwargs) -> Supplier | None:
        supplier = await cls.get(db, id)
        if supplier:
            for key, value in kwargs.items():
                setattr(supplier, key, value)
            await db.commit()
            await db.refresh(supplier)
        return supplier

class RFQ(Base):
    __tablename__ = "rfqs"
    id = Column(String, primary_key=True, default=generate_uuid)
    item = Column(String, nullable=False)
    due_date = Column(DateTime(timezone=True)) 
    amount_required_lbs = Column(Float)
    ship_to_location = Column(String)
    
    required_certifications = relationship("Certification", secondary=rfq_certification_association)

    quotes = relationship("Quote", back_populates="rfq")

    @classmethod
    async def create(cls, db: AsyncSession, **kwargs) -> RFQ:
        rfq = cls(**kwargs)
        db.add(rfq)
        await db.commit()
        await db.refresh(rfq)
        return rfq
    
    @classmethod
    async def get_all(cls, db: AsyncSession) -> list[RFQ]:
        query = select(cls).options(selectinload(cls.required_certifications))
        return (await db.execute(query)).scalars().all()

class Quote(Base):
    __tablename__ = "quotes"
    id = Column(String, primary_key=True, default=generate_uuid)
    date_submitted = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.UTC))
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    price_per_pound = Column(Numeric(10, 2))
    country_of_origin = Column(String)
    min_order_quantity = Column(Integer)
    
    rfq_id = Column(String, ForeignKey("rfqs.id"), nullable=False)

    certifications = relationship("Certification", secondary=quote_certification_association)
    
    supplier = relationship("Supplier", back_populates="quotes")
    rfq = relationship("RFQ", back_populates="quotes")
    emails = relationship("Email", back_populates="quote") # Relationship to the Email log

    __table_args__ = (UniqueConstraint('supplier_id', 'rfq_id', name='_supplier_rfq_uc'),)
    
    @classmethod
    async def get_by_rfq_id(cls, db: AsyncSession, rfq_id: str) -> list[Quote]:
        query = (
            select(cls)
            .where(cls.rfq_id == rfq_id)
            .options(selectinload(cls.supplier), selectinload(cls.certifications))
        )
        result = await db.execute(query)
        return result.scalars().all()

class Email(Base):
    __tablename__ = "emails"
    id = Column(String, primary_key=True, default=generate_uuid)
    raw_text = Column(Text, nullable=False)
    extracted_data = Column(JSONB)
    
    quote_id = Column(String, ForeignKey("quotes.id"), nullable=False)
    quote = relationship("Quote", back_populates="emails")