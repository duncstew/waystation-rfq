import pytest
from httpx import ASGITransport, AsyncClient
from pytest_postgresql import factories
from pytest_postgresql.janitor import DatabaseJanitor

from app import (
    init_app,
    models,  # noqa: F401
)
from app.services.database import get_db, sessionmanager

test_db = factories.postgresql_proc(port=None, dbname="test_db")


@pytest.fixture(scope="session", autouse=True)
async def connection_test(test_db):
    """
    Creates the database connection and session manager once per test session.
    This async fixture will now correctly use the session-scoped event loop.
    """
    pg_host = test_db.host
    pg_port = test_db.port
    pg_user = test_db.user
    pg_db = test_db.dbname
    pg_password = test_db.password

    with DatabaseJanitor(
        user=pg_user, host=pg_host, port=pg_port, dbname=pg_db,
        version=test_db.version, password=pg_password,
    ):
        connection_str = f"postgresql+asyncpg://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"
        sessionmanager.init(connection_str)
        yield
        await sessionmanager.close()


@pytest.fixture(scope="function", autouse=True)
async def create_tables(connection_test):
    """
    Creates and drops tables for each test function, ensuring a clean state.
    """
    async with sessionmanager.connect() as connection:
        await sessionmanager.drop_all(connection)
        await sessionmanager.create_all(connection)


@pytest.fixture(scope="function")
def app(create_tables):
    _app = init_app(init_db=False)
    yield _app


@pytest.fixture(scope="function")
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture(scope="function", autouse=True)
def session_override(app):
    async def get_db_override():
        async with sessionmanager.session() as session:
            yield session

    app.dependency_overrides[get_db] = get_db_override