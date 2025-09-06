from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Supplier as SupplierModel
from app.services.database import get_db

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

# Pydantic Schemas for data validation and serialization
class SupplierSchemaBase(BaseModel):
    company_name: str
    contact_name: str | None = None
    contact_email: EmailStr
    contact_phone: str | None = None
    hq_address: str | None = None
    payment_terms: str | None = None

class SupplierSchemaCreate(SupplierSchemaBase):
    pass

class SupplierSchemaUpdate(SupplierSchemaBase):
    company_name: str | None = None
    contact_email: EmailStr | None = None

class SupplierSchema(SupplierSchemaBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

@router.post("", response_model=SupplierSchema, status_code=201)
async def create_supplier(supplier_in: SupplierSchemaCreate, db: AsyncSession = Depends(get_db)):
    """Create a new supplier."""
    supplier = await SupplierModel.create(db, **supplier_in.model_dump())
    return supplier

@router.get("", response_model=list[SupplierSchema])
async def get_suppliers(db: AsyncSession = Depends(get_db)):
    """Retrieve a list of all suppliers."""
    return await SupplierModel.get_all(db)

@router.put("/{supplier_id}", response_model=SupplierSchema)
async def update_supplier(supplier_id: str, supplier_in: SupplierSchemaUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing supplier."""
    update_data = supplier_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
        
    supplier = await SupplierModel.update(db, id=supplier_id, **update_data)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier