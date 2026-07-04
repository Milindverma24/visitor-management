import sys
import os
from sqlalchemy import text

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.database import engine

def run_migration():
    print("Running migration to add base64 database storage columns...")
    with engine.begin() as conn:
        # 1. Add columns to visits
        try:
            print("Adding qr_code_base64 to visits...")
            conn.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT;"))
        except Exception as e:
            print(f"visits table notice: {e}")
            
        try:
            print("Adding badge_pdf_base64 to visits...")
            conn.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS badge_pdf_base64 TEXT;"))
        except Exception as e:
            print(f"visits table notice: {e}")
            
        # 2. Update visitors photo_path type to TEXT in PostgreSQL (SQLite already treats String as TEXT)
        try:
            print("Altering visitors.photo_path type to TEXT...")
            conn.execute(text("ALTER TABLE visitors ALTER COLUMN photo_path TYPE TEXT;"))
        except Exception as e:
            print(f"visitors table notice (expected on SQLite): {e}")
            
    print("Database columns migration completed successfully!")

if __name__ == "__main__":
    run_migration()
