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
if not DATABASE_URL:
    DATABASE_URL = (
        f"postgresql://"
        f"{settings.POSTGRES_USER}:"
        f"{settings.POSTGRES_PASSWORD}@"
        f"{settings.POSTGRES_HOST}:"
        f"{settings.POSTGRES_PORT}/"
        f"{settings.POSTGRES_DB}"
    )

##################################################
# SQLALCHEMY ENGINE
##################################################

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

##################################################
# BASE MODEL
##################################################

Base = declarative_base()