import os
import sys

# Add the current directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import engine
from sqlalchemy import text

def run_migration():
    print("Running migration to alter profile_photo_path to TEXT...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ALTER COLUMN profile_photo_path TYPE TEXT;"))
            conn.commit()
            print("Migration successful! profile_photo_path is now unlimited TEXT.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
