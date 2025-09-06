import pytest
from httpx import AsyncClient

# Mark the test file as requiring the asyncio test runner
pytestmark = pytest.mark.asyncio


async def test_get_suppliers_on_clean_db(client: AsyncClient):
    """
    Checks that the GET /api/suppliers endpoint returns an empty list.
    """
    response = await client.get("/api/suppliers")

    assert response.status_code == 200
    assert response.json() == []