#!/usr/bin/env python3
"""Add rank column to users table"""

import sqlite3

def add_rank_column():
    conn = sqlite3.connect('dev.db')
    cursor = conn.cursor()
    
    try:
        # Check if rank column exists
        cursor.execute('PRAGMA table_info(users)')
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'rank' not in column_names:
            print("Adding rank column...")
            cursor.execute('ALTER TABLE users ADD COLUMN rank VARCHAR(20) DEFAULT "STANDARD"')
            cursor.execute('UPDATE users SET rank = "STANDARD" WHERE rank IS NULL')
            conn.commit()
            print("Rank column added successfully!")
        else:
            print("Rank column already exists!")
            
        # Verify the column was added
        cursor.execute('PRAGMA table_info(users)')
        columns = cursor.fetchall()
        print("\nCurrent users table columns:")
        for col in columns:
            print(f"  {col[1]} {col[2]}")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_rank_column()
