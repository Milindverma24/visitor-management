from sqlalchemy import text
from app.database.database import engine

def migrate_db():
    print(f"Connecting to database via SQLAlchemy engine...")
    
    tables_to_update = [
        "visits",
        "contractors",
        "vendors",
        "materials",
        "blacklist"
    ]
    
    with engine.begin() as conn:
        for table in tables_to_update:
            try:
                # Add the column. If it exists, PostgreSQL will throw an error, which we catch.
                print(f"Adding plant_id to {table}...")
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL;"))
            except Exception as e:
                print(f"Notice updating {table}: {e}")
            
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate_db()
