#!/usr/bin/env python3
"""
Alembic 마이그레이션 생성 스크립트
사용자 모델 변경 사항을 자동으로 감지하여 마이그레이션 파일 생성
"""
import subprocess
import sys
import os
from datetime import datetime

def create_migration(message="Auto migration"):
    """새로운 마이그레이션 파일 생성"""
    try:
        # 타임스탬프가 포함된 메시지 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        migration_message = f"{timestamp}_{message.replace(' ', '_')}"
        
        print(f"🔄 새로운 마이그레이션 생성 중: {migration_message}")
        
        # Alembic autogenerate 명령 실행
        result = subprocess.run([
            "alembic", "revision", "--autogenerate", 
            "-m", migration_message
        ], capture_output=True, text=True, check=True)
        
        print("✅ 마이그레이션 파일 생성 완료!")
        print(f"출력: {result.stdout}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 마이그레이션 생성 실패: {e}")
        print(f"오류 출력: {e.stderr}")
        return False

def check_current_state():
    """현재 Alembic 상태 확인"""
    try:
        result = subprocess.run([
            "alembic", "current"
        ], capture_output=True, text=True, check=True)
        
        print("📋 현재 마이그레이션 상태:")
        print(result.stdout)
        
    except subprocess.CalledProcessError as e:
        print(f"⚠️ 상태 확인 실패: {e}")

def show_migration_history():
    """마이그레이션 히스토리 표시"""
    try:
        result = subprocess.run([
            "alembic", "history", "--verbose"
        ], capture_output=True, text=True, check=True)
        
        print("📜 마이그레이션 히스토리:")
        print(result.stdout)
        
    except subprocess.CalledProcessError as e:
        print(f"⚠️ 히스토리 조회 실패: {e}")

if __name__ == "__main__":
    print("🚀 Alembic 마이그레이션 관리 도구")
    print("="*50)
    
    # 현재 상태 확인
    check_current_state()
    
    # 사용자 입력 받기
    if len(sys.argv) > 1:
        migration_message = " ".join(sys.argv[1:])
    else:
        migration_message = input("마이그레이션 메시지를 입력하세요 (기본값: 'Auto migration'): ").strip()
        if not migration_message:
            migration_message = "Auto migration"
    
    # 마이그레이션 생성
    if create_migration(migration_message):
        print("\n" + "="*50)
        print("📜 업데이트된 마이그레이션 히스토리:")
        show_migration_history()
        
        print("\n🔍 업그레이드하려면 다음 명령을 실행하세요:")
        print("python db_auto_init.py")
        print("또는")
        print("alembic upgrade head")
    else:
        sys.exit(1)
