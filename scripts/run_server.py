"""
Casino-Club F2P 백엔드 서버 실행 스크립트
"""
import uvicorn
import os
import sys
import time
import subprocess
from pathlib import Path

def check_requirements():
    """필요한 라이브러리가 설치되어 있는지 확인"""
    try:
        import fastapi
        import sqlalchemy
        import uvicorn
        return True
    except ImportError as e:
        print(f"❌ 필요한 라이브러리가 설치되어 있지 않습니다: {e}")
        return False

def install_requirements():
    """필요한 라이브러리 설치"""
    print("📦 필요한 패키지를 설치합니다...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ 패키지 설치 완료")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 패키지 설치 중 오류 발생: {e}")
        return False

def check_database():
    """데이터베이스 파일이 존재하는지 확인"""
    db_file = Path("dev.db")
    if not db_file.exists():
        print("🔴 데이터베이스 파일이 존재하지 않습니다.")
        print("🔄 데이터베이스를 초기화합니다...")
        
        try:
            # cc-webapp/backend 디렉토리로 이동 후 초기화 스크립트 실행
            backend_dir = Path("cc-webapp/backend")
            os.chdir(backend_dir)
            subprocess.run([sys.executable, "create_new_db.py"], check=True)
            subprocess.run([sys.executable, "create_fixed_invites.py"], check=True)
            os.chdir("../..")  # 원래 디렉토리로 복귀
            print("✅ 데이터베이스 초기화 완료")
        except subprocess.CalledProcessError as e:
            print(f"❌ 데이터베이스 초기화 중 오류 발생: {e}")
            return False
    return True

def main():
    """메인 실행 함수"""
    print("🎮 Casino-Club F2P 백엔드 서버 시작 중...")
    
    # 작업 디렉토리를 스크립트 위치로 변경
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 패키지 확인 및 설치
    if not check_requirements() and not install_requirements():
        sys.exit(1)
    
    # 데이터베이스 확인 및 초기화
    if not check_database():
        sys.exit(1)
    
    # 서버 실행
    print("\n🚀 FastAPI 서버를 시작합니다...")
    print("🌐 API 문서: http://localhost:8000/docs")
    print("🔑 테스트용 초대코드: 5882, 6969, 6974")
    print("🛑 서버 중지: Ctrl+C를 눌러주세요\n")
    
    try:
        # 환경 변수 설정
        os.environ["DATABASE_URL"] = "postgresql://ccadmin:strongpassword@localhost/casino_club"
        
        # FastAPI 서버 실행
        os.chdir("cc-webapp/backend")  # 백엔드 디렉토리로 이동
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n👋 서버가 종료되었습니다.")
    except Exception as e:
        print(f"\n❌ 서버 실행 중 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
