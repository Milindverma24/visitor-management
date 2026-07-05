##################################################
# IMPORTS
##################################################

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings


##################################################
# DATABASE URL
##################################################

import os

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = (
        f"postgresql://"
        f"{settings.POSTGRES_USER}:"
        f"{settings.POSTGRES_PASSWORD}@"
        f"{settings.POSTGRES_HOST}:"
        f"{settings.POSTGRES_PORT}/"
        f"{settings.POSTGRES_DB}"
    )

from sqlalchemy.pool import NullPool

# If DATABASE_URL is remote (not localhost/127.0.0.1), use NullPool to avoid connection limit exhaustion on Render/Neon
use_null_pool = "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL
engine_kwargs = {
    "pool_pre_ping": True,
}
if use_null_pool:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(
    DATABASE_URL,
    **engine_kwargs
)

##################################################
# BASE MODEL
##################################################

Base = declarative_base()