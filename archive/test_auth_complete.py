"""완전한 인증 시스템 테스트"""
import requests
import json
from datetime import datetime


def test_authentication_flow():
    """완전한 인증 플로우 테스트"""
    base_url = "http://localhost:8000"
    
    print("🚀 인증 시스템 테스트 시작...")
    print("=" * 50)
    
    # 1. 회원가입 테스트 (초대코드 5858)
    print("\n1️⃣ 회원가입 테스트 (초대코드 5858)")
    signup_data = {
        "site_id": f"testuser_{datetime.now().strftime('%H%M%S')}",
        "nickname": f"테스터_{datetime.now().strftime('%H%M%S')}",
        "phone_number": f"010{datetime.now().strftime('%H%M%S')}",
        "password": "testpass123",
        "full_name": "테스트 사용자",
        "invite_code": "5858"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/signup",
            json=signup_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 회원가입 성공!")
            print(f"   사용자 ID: {result['user']['id']}")
            print(f"   사이트 ID: {result['user']['site_id']}")
            print(f"   닉네임: {result['user']['nickname']}")
            print(f"   폰번호: {result['user']['phone_number']}")
            print(f"   토큰: {result['access_token'][:50]}...")
            signup_token = result['access_token']
            test_site_id = signup_data['site_id']
        else:
            print(f"❌ 회원가입 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ 회원가입 오류: {e}")
        return
    
    # 2. 로그인 테스트
    print("\n2️⃣ 로그인 테스트")
    login_data = {
        "site_id": test_site_id,
        "password": "testpass123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 로그인 성공!")
            print(f"   사용자: {result['user']['site_id']}")
            print(f"   토큰: {result['access_token'][:50]}...")
            login_token = result['access_token']
        else:
            print(f"❌ 로그인 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ 로그인 오류: {e}")
        return
    
    # 3. 토큰 검증 테스트 (보호된 엔드포인트)
    print("\n3️⃣ 토큰 검증 테스트")
    try:
        response = requests.get(
            f"{base_url}/auth/me",
            headers={"Authorization": f"Bearer {login_token}"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 토큰 검증 성공!")
            print(f"   현재 사용자: {result['site_id']}")
            print(f"   관리자 여부: {result['is_admin']}")
        else:
            print(f"❌ 토큰 검증 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            
    except Exception as e:
        print(f"❌ 토큰 검증 오류: {e}")
    
    # 4. 관리자 로그인 테스트
    print("\n4️⃣ 관리자 로그인 테스트")
    admin_login_data = {
        "site_id": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/admin/login",
            json=admin_login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 관리자 로그인 성공!")
            print(f"   관리자: {result['user']['site_id']}")
            print(f"   관리자 토큰: {result['access_token'][:50]}...")
            admin_token = result['access_token']
        else:
            print(f"❌ 관리자 로그인 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ 관리자 로그인 오류: {e}")
        return
    
    # 5. 잘못된 초대코드로 회원가입 테스트
    print("\n5️⃣ 잘못된 초대코드 테스트")
    wrong_invite_data = {
        "site_id": f"wronguser_{datetime.now().strftime('%H%M%S')}",
        "nickname": f"잘못된테스터_{datetime.now().strftime('%H%M%S')}",
        "phone_number": f"010{datetime.now().strftime('%H%M%S')}",
        "password": "testpass123",
        "full_name": "잘못된 사용자",
        "invite_code": "1234"  # 잘못된 초대코드
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/signup",
            json=wrong_invite_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print(f"✅ 잘못된 초대코드 차단 성공!")
            print(f"   오류 메시지: {response.json()['detail']}")
        else:
            print(f"❌ 잘못된 초대코드가 통과됨: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 잘못된 초대코드 테스트 오류: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 인증 시스템 테스트 완료!")


if __name__ == "__main__":
    test_authentication_flow()
