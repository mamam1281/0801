#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Casino-Club F2P 테스트 계정 생성 스크립트
=======================================
인증 시스템 테스트를 위한 계정 생성

이 스크립트는 데이터베이스 모델이 수정된 후에 사용해야 합니다.
"""

import requests
import json
import time

# 설정
BASE_URL = "http://localhost:8000"

def print_header(title):
    """헤더 출력"""
    print("\n" + "="*80)
    print(f"🔍 {title}")
    print("="*80)

def print_response(response, label="응답"):
    """응답 정보 출력"""
    print(f"\n📝 {label} ({response.status_code}):")
    try:
        print(json.dumps(response.json(), ensure_ascii=False, indent=2))
    except:
        print(response.text)

def test_server_health():
    """서버 상태 확인"""
    print_header("서버 상태 확인")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print_response(response)
        
        if response.status_code == 200:
            print("✅ 서버가 정상 작동 중입니다.")
            return True
        else:
            print("❌ 서버가 비정상 상태입니다.")
            return False
    except Exception as e:
        print(f"❌ 서버 연결 오류: {str(e)}")
        return False

def create_test_user(nickname, site_id=None, invite_code="5858"):
    """테스트 사용자 생성"""
    print_header(f"테스트 사용자 생성: {nickname}")
    
    try:
        params = {
            "invite_code": invite_code, 
            "nickname": nickname
        }
        
        # 사이트 ID가 제공된 경우 파라미터에 추가
        if site_id:
            params["site_id"] = site_id
            print(f"🔧 사용자 지정 사이트 ID 사용: {site_id}")
        
        response = requests.post(f"{BASE_URL}/auth/register", params=params)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 사용자 생성 성공!")
            print(f"   - 사이트 ID: {data.get('site_id')}")
            print(f"   - 닉네임: {nickname}")
            return data
        else:
            print(f"❌ 사용자 생성 실패 (코드: {response.status_code})")
            return None
    except Exception as e:
        print(f"❌ 사용자 생성 요청 오류: {str(e)}")
        return None

def test_login(site_id):
    """로그인 테스트"""
    print_header(f"로그인 테스트: {site_id}")
    
    try:
        # 먼저 디버깅 정보 확인
        print(f"🔍 로그인 시도: {site_id}")
        
        # 여러 가지 방법으로 시도
        # 1. 쿼리 파라미터로 시도
        params = {"site_id": site_id}
        print("🔄 쿼리 파라미터로 시도 중...")
        response = requests.post(f"{BASE_URL}/auth/login", params=params)
        print_response(response, "쿼리 파라미터 응답")
        
        # 응답이 성공이면 바로 반환
        if response.status_code == 200 and "access_token" in response.json():
            print(f"✅ 로그인 성공! (쿼리 파라미터 방식)")
            return response.json()
            
        # 2. JSON 본문으로 시도
        print("🔄 JSON 본문으로 시도 중...")
        response = requests.post(f"{BASE_URL}/auth/login", json={"site_id": site_id})
        print_response(response, "JSON 본문 응답")
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print(f"✅ 로그인 성공! 액세스 토큰 발급됨")
                return data
            else:
                print(f"❌ 로그인 응답에 액세스 토큰이 없습니다.")
        else:
            print(f"❌ 로그인 실패 (상태코드: {response.status_code})")
            
            # 서버 로그 확인 안내
            if response.status_code == 500:
                print("💡 힌트: 서버 로그를 확인하여 더 자세한 오류 정보를 얻으세요.")
                print("    docker logs cc_backend | grep -A 10 \"로그인 중 오류\"")
        
    except Exception as e:
        print(f"❌ 로그인 요청 오류: {str(e)}")
    
    return None

def test_profile(access_token):
    """프로필 조회 테스트"""
    if not access_token:
        print("❌ 액세스 토큰이 없어 프로필 테스트를 건너뜁니다.")
        return None
    
    print_header("프로필 조회 테스트")
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            print("✅ 프로필 조회 성공!")
            return response.json()
        else:
            print(f"❌ 프로필 조회 실패 (상태코드: {response.status_code})")
            
    except Exception as e:
        print(f"❌ 프로필 조회 요청 오류: {str(e)}")
    
    return None

def create_predefined_users():
    """문서에 정의된 테스트 계정 생성"""
    predefined_users = [
        {"nickname": "test_user", "site_id": "test@casino-club.local"},
        {"nickname": "admin_user", "site_id": "admin@casino-club.local"}
    ]
    
    results = []
    for user in predefined_users:
        result = create_test_user(user["nickname"], site_id=user["site_id"])
        results.append({
            "nickname": user["nickname"],
            "site_id": user["site_id"],
            "actual_result": result
        })
    
    return results

def test_existing_accounts():
    """기존 테스트 계정 로그인 테스트"""
    test_accounts = [
        "test@casino-club.local",
        "admin@casino-club.local"
    ]
    
    for account in test_accounts:
        login_data = test_login(account)
        if login_data and "access_token" in login_data:
            profile = test_profile(login_data["access_token"])
            if profile:
                print(f"\n✅ 사용자 '{account}'의 전체 인증 흐름 테스트 성공!")
            else:
                print(f"\n❌ 사용자 '{account}'의 프로필 조회 실패!")
        else:
            print(f"\n❌ 사용자 '{account}' 로그인 실패!")

def main():
    print("\n🧪 Casino-Club F2P 테스트 계정 생성/테스트 도구\n")
    
    # 서버 상태 확인
    if not test_server_health():
        print("\n❌ 서버 상태 확인에 실패했습니다. 프로그램을 종료합니다.")
        return
    
    print("\n1. 새 테스트 계정 생성")
    print("2. 기존 테스트 계정 로그인 테스트")
    print("3. 종료")
    
    choice = input("\n메뉴를 선택하세요: ")
    
    if choice == "1":
        create_predefined_users()
    elif choice == "2":
        test_existing_accounts()
    else:
        print("프로그램을 종료합니다.")

if __name__ == "__main__":
    main()
