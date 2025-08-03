"""
기본 인증 시스템을 위한 간소화된 스크립트
- 중복 제거
- 핵심 테이블만 생성
- 로그인/인증/회원가입 기본 틀
"""

import os
import sqlite3
from datetime import datetime

def create_basic_auth_tables():
    """기본 인증 테이블들 생성"""
    
    # SQLite 데이터베이스 연결
    db_path = "auth_system.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. users 테이블 (핵심)
    cursor.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id VARCHAR(50) UNIQUE NOT NULL,
        nickname VARCHAR(50) UNIQUE NOT NULL,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        invite_code VARCHAR(6) NOT NULL,
        cyber_token_balance INTEGER DEFAULT 200,
        rank VARCHAR(20) DEFAULT 'STANDARD',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME NULL
    )
    """)
    
    # 2. invite_codes 테이블
    cursor.execute("""
    CREATE TABLE invite_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(6) UNIQUE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 3. login_attempts 테이블 (로그인 시도 제한)
    cursor.execute("""
    CREATE TABLE login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        success BOOLEAN NOT NULL,
        attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent VARCHAR(500) NULL,
        failure_reason VARCHAR(100) NULL
    )
    """)
    
    # 4. refresh_tokens 테이블 (리프레시 토큰)
    cursor.execute("""
    CREATE TABLE refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash VARCHAR(128) UNIQUE NOT NULL,
        device_fingerprint VARCHAR(128) NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent VARCHAR(500) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        last_used_at DATETIME NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        revoked_at DATETIME NULL,
        revoke_reason VARCHAR(50) NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    # 5. user_sessions 테이블 (세션 관리)
    cursor.execute("""
    CREATE TABLE user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id VARCHAR(128) UNIQUE NOT NULL,
        device_fingerprint VARCHAR(128) NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent VARCHAR(500) NULL,
        login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        logout_at DATETIME NULL,
        logout_reason VARCHAR(50) NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    # 6. security_events 테이블 (보안 로그)
    cursor.execute("""
    CREATE TABLE security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NULL,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'INFO',
        description VARCHAR(500) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent VARCHAR(500) NULL,
        metadata VARCHAR(1000) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """)
    
    # 인덱스 생성
    indexes = [
        "CREATE INDEX ix_users_site_id ON users(site_id)",
        "CREATE INDEX ix_users_nickname ON users(nickname)",
        "CREATE INDEX ix_users_phone_number ON users(phone_number)",
        "CREATE INDEX ix_invite_codes_code ON invite_codes(code)",
        "CREATE INDEX ix_login_attempts_site_id ON login_attempts(site_id)",
        "CREATE INDEX ix_login_attempts_ip_address ON login_attempts(ip_address)",
        "CREATE INDEX ix_login_attempts_attempted_at ON login_attempts(attempted_at)",
        "CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens(user_id)",
        "CREATE INDEX ix_refresh_tokens_token_hash ON refresh_tokens(token_hash)",
        "CREATE INDEX ix_user_sessions_user_id ON user_sessions(user_id)",
        "CREATE INDEX ix_user_sessions_session_id ON user_sessions(session_id)",
        "CREATE INDEX ix_security_events_user_id ON security_events(user_id)",
        "CREATE INDEX ix_security_events_event_type ON security_events(event_type)",
    ]
    
    for index in indexes:
        cursor.execute(index)
    
    # 기본 데이터 입력
    # 초대코드 생성
    invite_codes = ['6969', '6974', '2560', 'TEST01', 'TEST02']
    for code in invite_codes:
        cursor.execute("INSERT INTO invite_codes (code) VALUES (?)", (code,))
    
    # 테스트 사용자 생성 (비밀번호: test123)
    from passlib.context import CryptContext
    try:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash("test123")
        
        cursor.execute("""
        INSERT INTO users (site_id, nickname, phone_number, password_hash, invite_code)
        VALUES (?, ?, ?, ?, ?)
        """, ("testuser", "테스트유저", "010-1234-5678", password_hash, "6969"))
        
        print("✅ 테스트 사용자 생성 완료 (site_id: testuser, password: test123)")
    except ImportError:
        print("⚠️ passlib 없음 - 테스트 사용자 생성 스킵")
    
    conn.commit()
    conn.close()
    
    print(f"✅ 기본 인증 테이블 생성 완료: {db_path}")
    print("📋 생성된 테이블:")
    print("   - users (사용자)")
    print("   - invite_codes (초대코드)")
    print("   - login_attempts (로그인 시도)")
    print("   - refresh_tokens (리프레시 토큰)")
    print("   - user_sessions (세션)")
    print("   - security_events (보안 이벤트)")

if __name__ == "__main__":
    create_basic_auth_tables()
