# Backend Setup

### Prerequisites

  - **Python 3.13** (recommended)
  - **Docker** and **Docker Compose**
  - **Alembic**
  - **uv** (or pip)

### Quickstart
0. Add a gemini_api_key to get this running in llm_client.py on the api_key line.

1.  **Set up the database.** Run the following Docker command to start a local Postgres database:

    ```bash
    docker run --name waystation-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=waystation -p 5432:5432 -d postgres:16-alpine
    ```

2.  **Install dependencies.** Use `uv` to install the required Python packages from the project's `pyproject.toml` and `uv.lock` files:

    ```bash
    uv sync
    ```

3.  **Run database migrations.**
    Apply the database schema using Alembic:

    ```bash
    alembic upgrade head
    ```

4.  **Seed the database (optional).** Populate the database with sample data:

    ```bash
    python seed.py
    ```

5.  **Start the server.**
    Run the application using Uvicorn:

    ```bash
    uvicorn run:server --reload
    ```

    The API will be available at `http://localhost:8000`.