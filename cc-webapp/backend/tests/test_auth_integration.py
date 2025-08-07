"""
Casino-Club F2P - 인증 시스템 종합def test_01_signup():
    """회원가입 테스트"""
    # 테스트용 사용자 생성
    test_user = {
        "site_id": f"testuser_{int(time.time())}",
        "password": "test1234",
        "nickname": test_data["nickname"],
        "phone_number": f"010{int(time.time())%100000000:08d}",
        "invite_code": "5858"  # 무한 재사용 가능한 초대 코드
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup", 
        headers=HEADERS,
        json=test_user
    )======================================================================
인증 시스템의 전체 흐름을 종합적으로 테스트:
- 회원가입 → 로그인 → 토큰 갱신 → 보호된 리소스 접근 → 로그아웃 → 접근 불가 확인
"""

import pytest
import requests
import time
from unittest import mock

# 테스트 설정
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

# 테스트 데이터 저장
test_data = {
    "access_token": None,
    "refresh_token": None,
    "user_id": None,
    "nickname": f"tester_{int(time.time())}"
}

def setup_module(module):
    """테스트 모듈 초기화"""
    print("\n====== 인증 시스템 종합 테스트 시작 ======")

def teardown_module(module):
    """테스트 모듈 종료"""
    print("\n====== 인증 시스템 종합 테스트 완료 ======")

def test_01_signup():
    """회원가입 테스트"""
    # 테스트용 사용자 생성
    test_user = {
        "invite_code": "5858",  # 무제한 초대 코드
        "nickname": test_data["nickname"]
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/register", 
        headers=HEADERS,
        json=test_user
    )
    
    assert response.status_code == 200, f"회원가입 실패: {response.text}"
    data = response.json()
    
    # 토큰 및 사용자 정보 저장
    test_data["access_token"] = data["access_token"]
    test_data["refresh_token"] = data["refresh_token"]
    test_data["user_id"] = data["user_id"]
    
    assert data["nickname"] == test_data["nickname"], "닉네임이 일치하지 않습니다"
    assert "cyber_tokens" in data, "사이버 토큰 정보가 없습니다"
    
    print(f"✅ 회원가입 성공: {test_data['nickname']}")

def test_02_verify_invite_code():
    """초대 코드 검증 테스트"""
    # 유효한 초대 코드 테스트
    response = requests.post(
        f"{BASE_URL}/api/auth/verify-invite",
        headers=HEADERS,
        json={"inviteCode": "5858"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    
    # 잘못된 초대 코드 테스트
    response = requests.post(
        f"{BASE_URL}/api/auth/verify-invite",
        headers=HEADERS,
        json={"inviteCode": "wrong"}
    )
    assert response.status_code == 400
    print("✅ 초대 코드 검증 성공")
    
    assert response.status_code == 200, f"프로필 조회 실패: {response.text}"
    data = response.json()
    
    assert data["user_id"] == test_data["user_id"], "사용자 ID가 일치하지 않습니다"
    assert data["nickname"] == test_data["nickname"], "닉네임이 일치하지 않습니다"
    
    print("✅ 보호된 리소스 접근 성공")

def test_03_login():
    """로그인 테스트"""
    # 일반 사용자 로그인
    login_data = {
        "username": test_data["site_id"],
        "password": "test1234"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=login_data  # OAuth2 form data
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["site_id"] == test_data["site_id"]
    
    # 잘못된 비밀번호로 로그인
    wrong_login = login_data.copy()
    wrong_login["password"] = "wrong"
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=wrong_login
    )
    assert response.status_code == 401  # 인증 실패
    
    print("✅ 로그인 테스트 성공")
    
    assert response.status_code == 200, f"토큰 갱신 실패: {response.text}"
    data = response.json()
    
    # 새 토큰 저장
    old_token = test_data["access_token"]
    test_data["access_token"] = data["access_token"]
    
    if "refresh_token" in data:
        test_data["refresh_token"] = data["refresh_token"]
    
    assert test_data["access_token"] != old_token, "액세스 토큰이 변경되지 않았습니다"
    print("✅ 토큰 갱신 성공")

def test_04_admin_login():
    """관리자 로그인 테스트"""
    admin_data = {
        "site_id": "admin@casino-club.local",
        "password": "admin1234"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/admin/login",
        headers=HEADERS,
        json=admin_data
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["is_admin"] is True
    
    # 잘못된 관리자 자격증명
    wrong_admin = admin_data.copy()
    wrong_admin["password"] = "wrong"
    response = requests.post(
        f"{BASE_URL}/api/auth/admin/login",
        headers=HEADERS,
        json=wrong_admin
    )
    assert response.status_code == 401  # 인증 실패
    
    print("✅ 관리자 로그인 테스트 성공")
    
    assert response.status_code == 200, f"세션 목록 조회 실패: {response.text}"
    data = response.json()
    
    assert "active_sessions" in data, "세션 정보가 없습니다"
    assert data["total_count"] > 0, "활성 세션이 없습니다"
    
    print("✅ 새 토큰으로 보호된 리소스 접근 성공")

def test_05_refresh_token():
    """토큰 갱신 테스트"""
    assert test_data["access_token"], "액세스 토큰이 없습니다"
    
    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {test_data['access_token']}"
    }
    
    # 토큰 갱신
    response = requests.post(
        f"{BASE_URL}/api/auth/refresh",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    
    # 새 토큰 검증
    old_token = test_data["access_token"]
    test_data["access_token"] = data["access_token"]
    assert test_data["access_token"] != old_token, "액세스 토큰이 변경되지 않았습니다"
    
    print("✅ 토큰 갱신 테스트 성공")
    
    assert response.status_code == 200, f"로그아웃 실패: {response.text}"
    print("✅ 로그아웃 성공")

def test_06_logout():
    """로그아웃 테스트"""
    assert test_data["access_token"], "액세스 토큰이 없습니다"
    
    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {test_data['access_token']}"
    }
    
    # 로그아웃
    response = requests.post(
        f"{BASE_URL}/api/auth/logout",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["message"] == "로그아웃되었습니다"
    
    # 로그아웃 후 토큰으로 접근 시도
    response = requests.post(
        f"{BASE_URL}/api/auth/refresh",
        headers=auth_headers
    )
    assert response.status_code == 401  # 인증 실패
    
    print("✅ 로그아웃 테스트 성공")
    
    # 응답 코드가 401(Unauthorized)인지 확인
    assert response.status_code == 401, "로그아웃 후에도 인증이 유지됩니다"
    print("✅ 로그아웃 후 접근 거부 확인 성공")

def test_07_expired_token_handling():
    """만료된 토큰 처리 테스트 - 모의 테스트"""
    # 만료된 JWT 토큰 (특정 형식만 따르는 모의 토큰)
    expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    
    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {expired_token}"
    }
    
    # 사용자 프로필 조회 시도
    response = requests.get(
        f"{BASE_URL}/auth/profile",
        headers=auth_headers
    )
    
    # 응답 코드가 401(Unauthorized)인지 확인
    assert response.status_code == 401, f"만료된 토큰 처리 실패: {response.text}"
    print("✅ 만료된 토큰 처리 확인 성공")

def test_08_reuse_refresh_token():
    """사용된 리프레시 토큰 재사용 방지 테스트"""
    # 이미 사용한 리프레시 토큰
    used_refresh_token = test_data["refresh_token"]
    
    if not used_refresh_token:
        pytest.skip("리프레시 토큰이 없어 테스트를 건너뜁니다")
    
    refresh_data = {
        "refresh_token": used_refresh_token
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/refresh",
        headers=HEADERS,
        json=refresh_data
    )
    
    # 응답 코드가 401(Unauthorized)인지 확인
    assert response.status_code == 401, "사용된 리프레시 토큰이 재사용 가능합니다"
    print("✅ 리프레시 토큰 재사용 방지 확인 성공")
