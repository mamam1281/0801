"""
Export data from SQLite to JSON files for database migration.

This script connects to the SQLite database, exports all tables to JSON files,
and prepares the data for import to PostgreSQL.
"""
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
# Add the backend app to the path
sys.path.append('cc-webapp/backend')
from app.models import (
    Base, User, UserAction, UserSegment, InviteCode, 
    UserReward, AdultContent, Notification, FlashOffer, 
    VIPAccessLog, GameLog, UserStreak, TokenTransfer, 
    Game, SiteVisit
)

# Set up SQLite connection
sqlite_url = "sqlite:///./dev.db"
engine = create_engine(sqlite_url)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

# Create export directory
os.makedirs("data_export", exist_ok=True)

# Function to serialize a table to JSON
def export_table(model, filename):
    """Export a database table to a JSON file."""
    records = session.query(model).all()
    data = []
    for record in records:
        # Convert record to dict, handling datetime objects
        record_dict = {}
        for column in record.__table__.columns:
            value = getattr(record, column.name)
            # Convert datetime objects to ISO format string
            if hasattr(value, 'isoformat'):
                value = value.isoformat()
            record_dict[column.name] = value
        data.append(record_dict)
    
    with open(f"data_export/{filename}.json", 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Exported {len(data)} records to {filename}.json")

def main():
    """Run the export process for all database tables."""
    print("Starting data export from SQLite to JSON...")
    
    # Export all tables
    try:
        export_table(User, "users")
        export_table(UserAction, "user_actions")
        export_table(UserSegment, "user_segments")
        export_table(SiteVisit, "site_visits")
        export_table(InviteCode, "invite_codes")
        export_table(UserReward, "user_rewards")
        export_table(AdultContent, "adult_content")
        export_table(Notification, "notifications")
        export_table(FlashOffer, "flash_offers")
        export_table(VIPAccessLog, "vip_access_logs")
        export_table(GameLog, "game_logs")
        export_table(UserStreak, "user_streaks")
        export_table(TokenTransfer, "token_transfers")
        export_table(Game, "games")
        
        print("\n✅ Data export completed successfully!")
        print(f"📂 Data files saved in: {os.path.abspath('data_export')}")
    except Exception as e:
        print(f"❌ Error during data export: {e}")

if __name__ == "__main__":
    main()
