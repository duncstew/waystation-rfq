# Alembic & PostgreSQL Quickstart

This document outlines the essential workflows for using Alembic to manage your database schema with a local PostgreSQL instance running in Docker.

### Standard Workflow: Making Changes

Follow these steps when you modify your `models.py` file to apply the changes to your database.

1.  **Edit your models:** Add, modify, or remove columns in your `models.py` file.

2.  **Generate a migration:** Use the `revision` command to create a new migration script based on your changes.

    ```bash
    alembic revision --autogenerate -m "Your descriptive message here"
    ```

3.  **Apply the migration:** Run `upgrade` to apply the pending migration to the database.

    ```bash
    alembic upgrade head
    ```

---

### Full Database Reset

If you need to completely wipe the database and start fresh, use this workflow. **Warning: This will destroy all data.**

1.  **Clean up the database container:** Stop and remove the old Docker container.

    ```bash
    docker stop waystation-db
    docker rm waystation-db
    ```

2.  **Delete Alembic versions:** Manually delete all files from the `versions/` folder.

3.  **Start a new database container:** Spin up a fresh database instance.

    ```bash
    docker run --name waystation-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=waystation -p 5432:5432 -d postgres:16-alpine
    ```

4.  **Create initial tables:** Generate and apply a new migration to set up the database from scratch.

    ```bash
    alembic revision --autogenerate -m "Create initial tables"
    alembic upgrade head
    python seed.py
    ```