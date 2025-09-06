# app/config.py

import os


class Config:
    """
    Application configuration class.
    
    Reads database connection details from environment variables but provides
    hardcoded defaults for local development.
    """
    
    # --- Hardcoded Defaults (Wouldn't do this in actual app) ---
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "mysecretpassword")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "waystation")

    DB_CONFIG = os.getenv(
        "DB_CONFIG",
        f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

config = Config