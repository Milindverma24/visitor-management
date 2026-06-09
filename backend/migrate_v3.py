"""
IGLGATE v3.0 — Database Migration Script
=========================================
Applies all schema changes for the enterprise architecture upgrade.

Run: cd backend && python migrate_v3.py

Steps:
  1. Create `plants` table
  2. Add new columns to `users`
  3. Add new columns to `departments`
  4. Verify all columns exist

Safe to re-run — uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

##################################################
# ENGINE
##################################################

DATABASE_URL = (
    f"postgresql://{settings.POSTGRES_USER}:"
    f"{settings.POSTGRES_PASSWORD}@"
    f"{settings.POSTGRES_HOST}:"
    f"{settings.POSTGRES_PORT}/"
    f"{settings.POSTGRES_DB}"
)

engine = create_engine(DATABASE_URL)

##################################################
# MIGRATION STEPS
##################################################

MIGRATIONS = [

    ##################################################
    # STEP 1: Create plants table
    ##################################################
    (
        "CREATE plants table",
        """
        CREATE TABLE IF NOT EXISTS plants (
            id              SERIAL PRIMARY KEY,
            plant_code      VARCHAR(30) UNIQUE NOT NULL,
            plant_name      VARCHAR(255) NOT NULL,
            plant_address   VARCHAR(500),
            plant_city      VARCHAR(100),
            plant_state     VARCHAR(100) DEFAULT 'Delhi',
            plant_type      VARCHAR(100) DEFAULT 'CITY_GAS_STATION',
            is_active       BOOLEAN DEFAULT TRUE,
            created_at      TIMESTAMP DEFAULT NOW(),
            updated_at      TIMESTAMP DEFAULT NOW()
        );
        """
    ),

    ##################################################
    # STEP 2: Seed a default IGL plant so FK
    # constraints can be applied
    ##################################################
    (
        "Seed default IGL plant (IGL-CORP-HQ)",
        """
        INSERT INTO plants (plant_code, plant_name, plant_city, plant_state, plant_type, is_active)
        VALUES ('IGL-CORP-HQ', 'IGL Corporate Headquarters', 'New Delhi', 'Delhi', 'CORPORATE_HQ', TRUE)
        ON CONFLICT (plant_code) DO NOTHING;
        """
    ),

    ##################################################
    # STEP 3: Add new columns to users table
    ##################################################
    (
        "Add mobile_number to users",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);"
    ),
    (
        "Add designation to users",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(255);"
    ),
    (
        "Add plant_id FK to users",
        """
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plant_id INTEGER;
        """
    ),
    (
        "Add plant_id FK constraint to users",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'users_plant_id_fkey'
                  AND table_name = 'users'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_plant_id_fkey
                FOREIGN KEY (plant_id) REFERENCES plants(id);
            END IF;
        END$$;
        """
    ),
    (
        "Add reporting_manager_id to users",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reporting_manager_id INTEGER;"
    ),
    (
        "Add reporting_manager_id FK constraint to users",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'users_reporting_manager_id_fkey'
                  AND table_name = 'users'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_reporting_manager_id_fkey
                FOREIGN KEY (reporting_manager_id) REFERENCES users(id);
            END IF;
        END$$;
        """
    ),
    (
        "Add last_login to users",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;"
    ),

    ##################################################
    # STEP 4: Add new columns to departments table
    ##################################################
    (
        "Add plant_id to departments",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS plant_id INTEGER;"
    ),
    (
        "Add plant_id FK constraint to departments",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'departments_plant_id_fkey'
                  AND table_name = 'departments'
            ) THEN
                ALTER TABLE departments ADD CONSTRAINT departments_plant_id_fkey
                FOREIGN KEY (plant_id) REFERENCES plants(id);
            END IF;
        END$$;
        """
    ),
    (
        "Add parent_dept_id to departments",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_dept_id INTEGER;"
    ),
    (
        "Add parent_dept_id FK constraint to departments",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'departments_parent_dept_id_fkey'
                  AND table_name = 'departments'
            ) THEN
                ALTER TABLE departments ADD CONSTRAINT departments_parent_dept_id_fkey
                FOREIGN KEY (parent_dept_id) REFERENCES departments(id);
            END IF;
        END$$;
        """
    ),
    (
        "Add head_user_id to departments",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_user_id INTEGER;"
    ),
    (
        "Add description to departments",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS description VARCHAR(500);"
    ),
    (
        "Add updated_at to departments (if missing)",
        "ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();"
    ),

    ##################################################
    # STEP 5: Create index on plants.plant_code
    ##################################################
    (
        "Create index on plants.plant_code",
        """
        CREATE INDEX IF NOT EXISTS idx_plants_plant_code ON plants(plant_code);
        """
    ),
    (
        "Create index on users.plant_id",
        """
        CREATE INDEX IF NOT EXISTS idx_users_plant_id ON users(plant_id);
        """
    ),
    (
        "Create index on departments.plant_id",
        """
        CREATE INDEX IF NOT EXISTS idx_departments_plant_id ON departments(plant_id);
        """
    ),
]

##################################################
# RUN MIGRATIONS
##################################################

def run_migrations():
    print("=" * 60)
    print("IGLGATE v3.0 — Database Migration")
    print(f"Database: {settings.POSTGRES_DB} @ {settings.POSTGRES_HOST}")
    print("=" * 60)
    print()

    success_count = 0
    error_count = 0

    with engine.connect() as conn:
        for step_name, sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"  ✅  {step_name}")
                success_count += 1
            except Exception as e:
                conn.rollback()
                err = str(e).split('\n')[0]
                print(f"  ⚠️   {step_name}")
                print(f"       → {err}")
                error_count += 1

    print()
    print("=" * 60)
    print(f"Migration complete: {success_count} steps OK, {error_count} warnings")
    print("=" * 60)

    ##################################################
    # VERIFY final schema
    ##################################################
    print()
    print("Verifying final schema...")
    inspector = inspect(engine)

    checks = {
        "plants": ["id", "plant_code", "plant_name", "plant_city", "plant_type", "is_active"],
        "users":  ["plant_id", "reporting_manager_id", "mobile_number", "designation", "last_login"],
        "departments": ["plant_id", "parent_dept_id", "head_user_id", "description"],
    }

    all_ok = True
    for table, expected_cols in checks.items():
        existing = {c["name"] for c in inspector.get_columns(table)}
        for col in expected_cols:
            if col in existing:
                print(f"  ✅  {table}.{col}")
            else:
                print(f"  ❌  {table}.{col}  ← MISSING")
                all_ok = False

    print()
    if all_ok:
        print("✅  All schema checks PASSED — IGLGATE v3.0 migration complete.")
    else:
        print("❌  Some columns are missing — check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
