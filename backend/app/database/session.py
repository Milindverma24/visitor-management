##################################################
# IMPORTS
##################################################

from sqlalchemy.orm import sessionmaker

from app.database.database import engine


##################################################
# SESSION FACTORY
##################################################

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


##################################################
# DATABASE DEPENDENCY
##################################################

def get_db():
    """
    Purpose:
    Create and close database session
    automatically for every request.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()