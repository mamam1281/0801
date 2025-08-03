"""간단한 auth API 테스트"""
import requests
import json

def test_auth_endpoints():
    """Auth 엔드포인트 직접 테스트"""
    base_url = "http://localhost:8000"
    
    print("🧪 Auth 엔드포인트 직접 테스트")
    print("=" * 40)
    
    # 1. 회원가입 테스트
    signup_data = {
        "site_id": "directtest123",
        "nickname": "직접테스터",
        "phone_number": "01099999999",
        "password": "directtest123",
        "invite_code": "5858",
        "full_name": "직접 테스트 사용자"
    }
    
    print("1. 회원가입 테스트:")
    try:
        response = requests.post(
            f"{base_url}/auth/signup",
            json=signup_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   상태코드: {response.status_code}")
        print(f"   응답: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 2. 로그인 테스트
    login_data = {
        "site_id": "directtest123",
        "password": "directtest123"
    }
    
    print("\n2. 로그인 테스트:")
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   상태코드: {response.status_code}")
        print(f"   응답: {response.text[:200]}...")
    except Exception as e:
        print(f"   오류: {e}")

if __name__ == "__main__":
    test_auth_endpoints()
