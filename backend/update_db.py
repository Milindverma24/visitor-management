from sqlalchemy import create_engine, text
from app.core.config import settings

DATABASE_URL = (
    f"postgresql://"
    f"{settings.POSTGRES_USER}:"
    f"{settings.POSTGRES_PASSWORD}@"
    f"{settings.POSTGRES_HOST}:"
    f"{settings.POSTGRES_PORT}/"
    f"{settings.POSTGRES_DB}"
)

def run():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Altering users table to add profile_photo_path column...")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_path VARCHAR(500);"))
        conn.commit()
        print("Column added successfully!")

if __name__ == "__main__":
    run()
