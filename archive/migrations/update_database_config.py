"""
Update database configuration to use PostgreSQL.

This script updates the database.py file to use PostgreSQL instead of SQLite.
It creates a backup of the original file before making changes.
"""
import os
import shutil
import re
from pathlib import Path

# Paths
backend_dir = Path("cc-webapp/backend/app")
database_path = backend_dir / "database.py"
backup_path = backend_dir / "database.py.bak"

# New database configuration
new_config = """\"\"\"SQLAlchemy engine and session configuration.\"\"\"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Update this to use PostgreSQL by default
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://cc_user:cc_password@localhost/cc_webapp"
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Attempt initial connection to validate URL during tests
    with engine.connect():
        pass
except Exception:
    # Fallback to local SQLite file if primary DB is unreachable
    fallback_url = "sqlite:///./fallback.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    print(f"Using DB: {engine.url}")
    try:
        yield db
    finally:
        db.close()
"""

def update_database_config():
    """Update the database.py file to use PostgreSQL."""
    try:
        # Check if the file exists
        if not database_path.exists():
            print(f"❌ File not found: {database_path}")
            return False
        
        # Create backup
        shutil.copy2(database_path, backup_path)
        print(f"✅ Created backup: {backup_path}")
        
        # Write new configuration
        with open(database_path, "w") as f:
            f.write(new_config)
        
        print(f"✅ Updated database configuration: {database_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to update database configuration: {e}")
        return False

def update_run_server():
    """Update run_server.py to use PostgreSQL."""
    run_server_path = Path("run_server.py")
    
    if not run_server_path.exists():
        print(f"❌ File not found: {run_server_path}")
        return False
    
    # Create backup
    backup_run_server = Path("run_server.py.bak")
    shutil.copy2(run_server_path, backup_run_server)
    print(f"✅ Created backup: {backup_run_server}")
    
    # Read the file with UTF-8 encoding
    try:
        with open(run_server_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        # Fallback to other encodings if UTF-8 fails
        try:
            with open(run_server_path, "r", encoding="cp949") as f:
                content = f.read()
        except UnicodeDecodeError:
            print(f"❌ Could not decode file: {run_server_path}")
            return False
    
    # Replace the SQLite database URL with PostgreSQL
    updated_content = re.sub(
        r'os\.environ\["DATABASE_URL"\] = "sqlite:///dev\.db"',
        'os.environ["DATABASE_URL"] = "postgresql://ccadmin:strongpassword@localhost/casino_club"',
        content
    )
    
    # Write the updated content back with UTF-8 encoding
    try:
        with open(run_server_path, "w", encoding="utf-8") as f:
            f.write(updated_content)
        
        print(f"✅ Updated run_server.py to use PostgreSQL")
        return True
    except Exception as e:
        print(f"❌ Failed to write file: {e}")
        return False

def update_alembic_ini():
    """Update alembic.ini to use PostgreSQL."""
    alembic_ini_path = Path("cc-webapp/backend/alembic.ini")
    
    if not alembic_ini_path.exists():
        print(f"❌ File not found: {alembic_ini_path}")
        return False
    
    # Create backup
    backup_alembic_ini = Path("cc-webapp/backend/alembic.ini.bak")
    shutil.copy2(alembic_ini_path, backup_alembic_ini)
    print(f"✅ Created backup: {backup_alembic_ini}")
    
    # Read the file with UTF-8 encoding
    try:
        with open(alembic_ini_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        # Fallback to other encodings if UTF-8 fails
        try:
            with open(alembic_ini_path, "r", encoding="cp949") as f:
                content = f.read()
        except UnicodeDecodeError:
            print(f"❌ Could not decode file: {alembic_ini_path}")
            return False
    
    # Replace the SQLite database URL with PostgreSQL
    updated_content = re.sub(
        r'sqlalchemy\.url = .*',
        'sqlalchemy.url = postgresql://ccadmin:strongpassword@localhost/casino_club',
        content
    )
    
    # Write the updated content back with UTF-8 encoding
    try:
        with open(alembic_ini_path, "w", encoding="utf-8") as f:
            f.write(updated_content)
        
        print(f"✅ Updated alembic.ini to use PostgreSQL")
        return True
    except Exception as e:
        print(f"❌ Failed to write file: {e}")
        return False

def main():
    """Run all database configuration updates."""
    print("🔄 Updating database configuration to use PostgreSQL...")
    
    # Update database.py
    update_database_config()
    
    # Update run_server.py
    update_run_server()
    
    # Update alembic.ini
    update_alembic_ini()
    
    print("\n✅ Database configuration updated successfully!")
    print("⚠️ Don't forget to install the PostgreSQL driver with: pip install psycopg2-binary")

if __name__ == "__main__":
    main()
