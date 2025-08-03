"""
Import data from JSON files to PostgreSQL database.

This script reads the JSON files exported from SQLite and imports 
the data into a PostgreSQL database.
"""
import json
import os
import sys
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend app to the path
sys.path.append('cc-webapp/backend')
from app.models import (
    Base, User, UserAction, UserSegment, InviteCode, 
    UserReward, AdultContent, Notification, FlashOffer, 
    VIPAccessLog, GameLog, UserStreak, TokenTransfer, 
    Game, SiteVisit
)

# Set up PostgreSQL connection
postgres_url = os.getenv(
    "DATABASE_URL", 
    "postgresql://cc_user:cc_password@localhost/cc_webapp"
)
engine = create_engine(postgres_url)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

# Function to parse ISO datetime string
def parse_datetime(dt_str):
    """Convert ISO format datetime string to datetime object."""
    if dt_str is None:
        return None
    try:
        return datetime.fromisoformat(dt_str)
    except ValueError:
        return None

# Function to import data from JSON to a table
def import_table(model, filename):
    """Import data from a JSON file to a database table."""
    try:
        # Check if the file exists
        file_path = f"data_export/{filename}.json"
        if not os.path.exists(file_path):
            print(f"Warning: File {file_path} not found. Skipping.")
            return
            
        with open(file_path, 'r') as f:
            records = json.load(f)
        
        if not records:
            print(f"No records found in {filename}.json. Skipping.")
            return
            
        for record_data in records:
            # Convert datetime strings back to datetime objects
            for key, value in record_data.items():
                if isinstance(value, str) and (
                    key.endswith('_at') or 
                    key.endswith('_date') or 
                    key.endswith('_timestamp')
                ):
                    record_data[key] = parse_datetime(value)
            
            # Create a new record
            record = model(**record_data)
            session.add(record)
        
        # Commit after each table is imported
        session.commit()
        print(f"✅ Imported {len(records)} records to {model.__tablename__}")
    except Exception as e:
        session.rollback()
        print(f"❌ Error importing {filename}: {e}")

def create_database_schema():
    """Create all tables in PostgreSQL."""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database schema created successfully")
    except Exception as e:
        print(f"❌ Failed to create database schema: {e}")
        sys.exit(1)

def main():
    """Run the import process for all database tables."""
    print("🚀 Starting PostgreSQL data import...")
    
    # Create database schema
    create_database_schema()
    
    # Import all tables
    print("\n📥 Importing data from JSON files...")
    import_table(User, "users")
    import_table(UserAction, "user_actions")
    import_table(UserSegment, "user_segments")
    import_table(SiteVisit, "site_visits")
    import_table(InviteCode, "invite_codes")
    import_table(UserReward, "user_rewards")
    import_table(AdultContent, "adult_content")
    import_table(Notification, "notifications")
    import_table(FlashOffer, "flash_offers")
    import_table(VIPAccessLog, "vip_access_logs")
    import_table(GameLog, "game_logs")
    import_table(UserStreak, "user_streaks")
    import_table(TokenTransfer, "token_transfers")
    import_table(Game, "games")
    
    print("\n✅ Data import completed successfully!")

if __name__ == "__main__":
    main()
