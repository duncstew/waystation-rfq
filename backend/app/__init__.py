# app/__init__.py

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import config
from app.services.database import sessionmanager

def init_app(init_db=True):
    lifespan = None

    if init_db:
        sessionmanager.init(config.DB_CONFIG)

        @asynccontextmanager
        async def lifespan(app: FastAPI):
            yield
            if sessionmanager._engine is not None:
                await sessionmanager.close()

    server = FastAPI(title="Waystation RFQ API", lifespan=lifespan)
    
    # Add CORS middleware to allow requests from your frontend
    server.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],  
        allow_headers=["*"],  
    )
    
    # Import and include all your routers
    from app.views import quotes, rfqs, suppliers

    server.include_router(suppliers.router, prefix="/api")
    server.include_router(rfqs.router, prefix="/api")
    server.include_router(quotes.router, prefix="/api")

    return server