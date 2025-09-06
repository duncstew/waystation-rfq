import pytest
from httpx import AsyncClient

# Import models and session manager for test setup
from app.models import Quote
from app.services.database import sessionmanager

# Mark the test file as requiring the asyncio test runner
pytestmark = pytest.mark.asyncio


async def test_create_supplier_invalid_email(client: AsyncClient):
    """
    Checks that creating a supplier with an invalid email fails with a 422 Unprocessable Entity error.
    This tests Pydantic's built-in EmailStr validation.
    """
    response = await client.post("/api/suppliers", json={
        "company_name": "Invalid Email Corp",
        "contact_name": "Jane Doe",
        "contact_email": "not-a-valid-email",  # Invalid email format
        "contact_phone": "555-1234"
    })

    assert response.status_code == 422
    # Pydantic provides detailed error messages
    error_detail = response.json()["detail"][0]
    assert error_detail["type"] == "value_error"
    assert "valid email address" in error_detail["msg"]
    assert error_detail["loc"] == ["body", "contact_email"]


async def test_create_supplier_missing_required_field(client: AsyncClient):
    """
    Checks that creating a supplier without a required field (e.g., company_name)
    fails with a 422 Unprocessable Entity error.
    """
    response = await client.post("/api/suppliers", json={
        # "company_name" is missing
        "contact_name": "John Smith",
        "contact_email": "john.smith@example.com",
    })

    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["type"] == "missing"
    assert error_detail["msg"] == "Field required"
    assert error_detail["loc"] == ["body", "company_name"]


async def test_submit_email_for_quote_with_negative_price(client: AsyncClient):
    """
    Checks that submitting email data for a quote with a negative price fails with a 422 error.
    This tests the custom validation (Field(gt=0)) added to the Pydantic schema.
    """
    # --- Setup: Create prerequisite data ---
    # 1. Create a supplier
    supplier_res = await client.post("/api/suppliers", json={
        "company_name": "Test Supplier Inc.",
        "contact_email": "contact@testsupplier.com"
    })
    assert supplier_res.status_code == 201
    supplier_id = supplier_res.json()["id"]

    # 2. Create an RFQ
    rfq_res = await client.post("/api/rfqs", json={
        "item": "Organic Arabica Beans",
        "amount_required_lbs": 1000.0
    })
    assert rfq_res.status_code == 201
    rfq_id = rfq_res.json()["id"]

    # 3. Create a quote shell directly in the database, as there is no public endpoint for it.
    # This is a common pattern in integration tests to set up specific states.
    async with sessionmanager.session() as session:
        new_quote = Quote(supplier_id=supplier_id, rfq_id=rfq_id)
        session.add(new_quote)
        await session.commit()
        await session.refresh(new_quote)
        quote_id = new_quote.id

    # --- Test: Attempt to submit data with a negative price ---
    response = await client.post(
        f"/api/quotes/{quote_id}/submit-email",
        json={
            "raw_text": "Hello, here is our quote.",
            "quote_data": {
                "price_per_pound": -5.99,  # Invalid (negative) price
                "country_of_origin": "Ethiopia",
                "min_order_quantity": 50
            }
        }
    )

    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["type"] == "greater_than"
    assert "Input should be greater than 0" in error_detail["msg"]
    # Check that the error location points to the exact invalid field
    assert error_detail["loc"] == ["body", "quote_data", "price_per_pound"]