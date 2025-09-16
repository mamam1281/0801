"""
Python 환경 설정 문제 해결 도구
"""
import sys
import os
import subprocess

def check_python_environment():
    """Python 환경 확인"""
    print("=== Python 환경 진단 ===")
    print(f"Python 버전: {sys.version}")
    print(f"Python 실행 경로: {sys.executable}")
    print(f"현재 작업 디렉토리: {os.getcwd()}")
    print(f"Python 경로들:")
    for path in sys.path:
        print(f"  - {path}")
    
    # 백엔드 경로 확인
    backend_path = os.path.join(os.getcwd(), 'cc-webapp', 'backend')
    if os.path.exists(backend_path):
        print(f"✅ 백엔드 경로 존재: {backend_path}")
        
        # app 모듈 확인
        app_path = os.path.join(backend_path, 'app')
        if os.path.exists(app_path):
            print(f"✅ app 모듈 경로 존재: {app_path}")
        else:
            print(f"❌ app 모듈 경로 없음: {app_path}")
    else:
        print(f"❌ 백엔드 경로 없음: {backend_path}")

def check_requirements():
    """설치된 패키지 확인"""
    print("\n=== 주요 패키지 설치 상태 ===")
    packages = [
        'fastapi', 'prometheus-fastapi-instrumentator', 
        'sentry-sdk', 'sqlalchemy', 'redis'
    ]
    
    for package in packages:
        try:
            import importlib
            importlib.import_module(package.replace('-', '_'))
            print(f"✅ {package}: 설치됨")
        except ImportError:
            print(f"❌ {package}: 설치되지 않음")

def fix_test_files():
    """테스트 파일들의 import 경로 수정"""
    print("\n=== 테스트 파일 경로 수정 ===")
    
    # test_shop_service.py가 루트에 있다면 올바른 경로로 수정
    test_file = 'test_shop_service.py'
    if os.path.exists(test_file):
        print(f"📝 {test_file} 경로 수정 필요")
        with open(test_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 경로 수정
        if 'sys.path.append' not in content:
            new_content = content.replace(
                'from app.database import',
                'import sys\nimport os\nsys.path.append(os.path.join(os.path.dirname(__file__), "cc-webapp", "backend"))\nfrom app.database import'
            )
            
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ {test_file} 경로 수정 완료")

if __name__ == "__main__":
    check_python_environment()
    check_requirements()
    fix_test_files()
    
    print("\n=== 해결 방안 ===")
    print("1. VS Code에서 Python 인터프리터 설정:")
    print("   - Ctrl+Shift+P → 'Python: Select Interpreter'")
    print("   - Docker 컨테이너의 Python 선택 또는")
    print("   - 로컬 가상환경의 Python 선택")
    print("")
    print("2. 작업 디렉토리 설정:")
    print("   - VS Code에서 cc-webapp/backend를 작업 폴더로 열기")
    print("")
    print("3. 패키지 설치 확인:")
    print("   - 컨테이너에서: pip install -r requirements.txt")
    print("   - 로컬에서: pip install -r cc-webapp/backend/requirements.txt")
