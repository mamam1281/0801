"""
간단한 SQLite 데이터베이스 초기화 스크립트
- 직접 SQL 명령어 사용
"""

import sqlite3
import os
from pathlib import Path

def create_auth_tables():
    """인증 관련 테이블 생성"""
    
    # 데이터베이스 파일 경로
    db_path = Path(__file__).parent / "auth.db"
    
    print(f"🗃️ 데이터베이스 파일: {db_path}")
    
    # 기존 파일이 있으면 백업
    if db_path.exists():
        backup_path = db_path.with_suffix(".db.backup")
        if backup_path.exists():
            backup_path.unlink()
        db_path.rename(backup_path)
        print(f"📦 기존 DB 백업: {backup_path}")
    
    # 새 데이터베이스 생성
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("📝 테이블 생성 중...")
    
    # 사용자 테이블
    cursor.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id VARCHAR(50) UNIQUE NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        invite_code VARCHAR(20),
        cyber_token_balance INTEGER DEFAULT 0,
        rank VARCHAR(20) DEFAULT 'bronze',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    print("  ✅ users 테이블 생성")
    
    # 초대 코드 테이블
    cursor.execute("""
    CREATE TABLE invite_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
    )
    """)
    print("  ✅ invite_codes 테이블 생성")
    
    # 로그인 시도 테이블
    cursor.execute("""
    CREATE TABLE login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        user_id INTEGER,
        failure_reason VARCHAR(50),
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)
    print("  ✅ login_attempts 테이블 생성")
    
    # 리프레시 토큰 테이블
    cursor.execute("""
    CREATE TABLE refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        jti VARCHAR(255) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)
    print("  ✅ refresh_tokens 테이블 생성")
    
    # 사용자 세션 테이블
    cursor.execute("""
    CREATE TABLE user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        logout_at TIMESTAMP,
        logout_reason VARCHAR(50),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)
    print("  ✅ user_sessions 테이블 생성")
    
    # 보안 이벤트 테이블
    cursor.execute("""
    CREATE TABLE security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        details TEXT,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)
    print("  ✅ security_events 테이블 생성")
    
    # 인덱스 생성
    print("🔍 인덱스 생성 중...")
    cursor.execute("CREATE INDEX idx_users_site_id ON users(site_id)")
    cursor.execute("CREATE INDEX idx_login_attempts_site_id ON login_attempts(site_id)")
    cursor.execute("CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address)")
    cursor.execute("CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)")
    cursor.execute("CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id)")
    print("  ✅ 인덱스 생성 완료")
    
    # 기본 데이터 삽입
    print("📊 기본 데이터 삽입 중...")
    
    # 초대 코드들
    invite_codes = ["WELCOME1", "INVITE01", "START123", "CASINO1", "CLUB001"]
    for code in invite_codes:
        cursor.execute("INSERT INTO invite_codes (code) VALUES (?)", (code,))
    print(f"  ✅ {len(invite_codes)}개 초대 코드 생성")
    
    # 관리자 계정 (bcrypt로 해싱된 'admin123')
    admin_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmP1ZbK9.xAjE9." 
    cursor.execute("""
    INSERT INTO users (site_id, nickname, phone_number, password_hash, invite_code, cyber_token_balance, rank)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("admin", "관리자", "010-0000-0000", admin_hash, "WELCOME1", 10000, "admin"))
    print("  ✅ 관리자 계정 생성 (admin/admin123)")
    
    # 테스트 계정들 (bcrypt로 해싱된 'test123')
    test_hash = "$2b$12$YQjN.B1r6lYMfLJOY3xhqutY6z3.L4qFvS4ysQw2xtB3JYKyT8Fxy"
    test_users = [
        ("testuser1", "테스트유저1", "010-1111-1111", test_hash),
        ("testuser2", "테스트유저2", "010-2222-2222", test_hash),
        ("demo", "데모유저", "010-9999-9999", test_hash)
    ]
    
    for site_id, nickname, phone, password_hash in test_users:
        cursor.execute("""
        INSERT INTO users (site_id, nickname, phone_number, password_hash, invite_code, cyber_token_balance)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (site_id, nickname, phone, password_hash, "INVITE01", 500))
    print(f"  ✅ {len(test_users)}개 테스트 계정 생성 (비밀번호: test123)")
    
    # 변경사항 저장
    conn.commit()
    
    # 생성된 데이터 확인
    print("\n📋 생성된 테이블:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    for table in tables:
        print(f"  📊 {table[0]}")
    
    print("\n🔍 생성된 데이터:")
    cursor.execute("SELECT COUNT(*) FROM invite_codes")
    invite_count = cursor.fetchone()[0]
    print(f"  🎫 초대 코드: {invite_count}개")
    
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"  👤 사용자: {user_count}명")
    
    conn.close()
    print(f"\n🎉 데이터베이스 초기화 완료! ({db_path})")

if __name__ == "__main__":
    create_auth_tables()
