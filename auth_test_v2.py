#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Casino-Club F2P 인증 API 테스트 - 버전 2
==================================
현재 설정에 맞는 간단한 인증 테스트 스크립트
"""

import requests
import json
import time
from datetime import datetime

# 테스트 설정
BASE_URL = "http://localhost:8000"
TOKEN = None  # 로그인 후 저장될 토큰

def print_header(title):
    """테스트 헤더 출력"""
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

def test_health():
    """헬스 체크 테스트"""
    print_header("헬스 체크")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print_response(response)
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ 서버 연결 실패. 백엔드 서버가 실행 중인지 확인하세요.")
        return False
    except requests.exceptions.Timeout:
        print("❌ 서버 응답 시간 초과. 백엔드 서버가 응답하지 않습니다.")
        return False

def test_api_info():
    """API 정보 테스트"""
    print_header("API 정보 확인")
    try:
        response = requests.get(f"{BASE_URL}/api", timeout=5)
        print_response(response)
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ 서버 연결 실패. 백엔드 서버가 실행 중인지 확인하세요.")
        return False
    except requests.exceptions.Timeout:
        print("❌ 서버 응답 시간 초과. 백엔드 서버가 응답하지 않습니다.")
        return False

def list_auth_endpoints():
    """인증 관련 엔드포인트 테스트"""
    endpoints = [
        "/auth/register",
        "/auth/login", 
        "/auth/refresh",
        "/auth/profile",
        "/auth/logout"
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            if "login" in endpoint or "register" in endpoint or "refresh" in endpoint:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            else:
                response = requests.get(f"{BASE_URL}{endpoint}")
                
            # 401 (인증 필요) 또는 422 (요청 형식 오류)는 엔드포인트가 존재한다는 의미
            exists = response.status_code != 404
            results[endpoint] = {
                "exists": exists,
                "status": response.status_code
            }
        except Exception as e:
            print(f"Error testing {endpoint}: {str(e)}")
            results[endpoint] = {"exists": False, "status": "연결 오류"}
    
    return results

def test_register():
    """회원가입 테스트"""
    print_header("회원가입 테스트")
    
    # 테스트용 회원가입 정보
    timestamp = int(time.time())
    nickname = f"test_user_{timestamp}"  # 고유한 닉네임 생성
    
    try:
        # F2P 버전에서는 초대코드와 닉네임만 필요
        params = {
            "invite_code": "5858",  # 무제한 사용 가능한 초대코드
            "nickname": nickname
        }
        response = requests.post(f"{BASE_URL}/auth/register", params=params)
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print(f"✅ 회원가입 성공! 닉네임: {nickname}")
                return data
            else:
                print("❌ 회원가입 응답에 액세스 토큰이 없습니다.")
        else:
            print(f"❌ 회원가입 실패 (상태코드: {response.status_code})")
        
    except Exception as e:
        print(f"❌ 회원가입 요청 오류: {str(e)}")
    
    return None

def test_login(site_id=None):
    """로그인 테스트"""
    print_header("로그인 테스트")
    
    # 테스트용 사이트 ID (회원가입 없이 바로 테스트할 경우)
    if site_id is None:
        site_id = "casino_user_1722103234"  # 기존에 가입된 사용자 ID
    
    try:
        # F2P 버전에서는 site_id만 필요 (비밀번호 필요없음)
        params = {"site_id": site_id}
        response = requests.post(f"{BASE_URL}/auth/login", params=params)
        print_response(response)
        
        if response.status_code == 200:
            token_data = response.json()
            if "access_token" in token_data:
                print("✅ 로그인 성공! 액세스 토큰 발급됨")
                return token_data["access_token"]
            else:
                print("❌ 로그인 응답에 액세스 토큰이 없습니다.")
        else:
            print(f"❌ 로그인 실패 (상태코드: {response.status_code})")
        
    except Exception as e:
        print(f"❌ 로그인 요청 오류: {str(e)}")
    
    return None

def test_profile(access_token):
    """프로필 조회 테스트"""
    if not access_token:
        print("❌ 액세스 토큰이 없어 프로필 테스트를 건너뜁니다.")
        return
    
    print_header("프로필 조회 테스트")
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
        print_response(response)
        
        if response.status_code == 200:
            print("✅ 프로필 조회 성공!")
        else:
            print(f"❌ 프로필 조회 실패 (상태코드: {response.status_code})")
            
    except Exception as e:
        print(f"❌ 프로필 조회 요청 오류: {str(e)}")

def main():
    """메인 테스트 실행"""
    print("\n🔐 Casino-Club F2P 인증 API 테스트 시작\n")
    
    # 서버 상태 확인
    if not test_health():
        print("\n❌ 헬스 체크 실패. 서버가 정상적으로 실행 중인지 확인하세요.")
        return
    
    # API 정보 확인
    test_api_info()
    
    # 인증 관련 엔드포인트 확인
    print_header("인증 관련 엔드포인트 확인")
    endpoints = list_auth_endpoints()
    
    print("\n✅ 인증 엔드포인트 상태:")
    for endpoint, data in endpoints.items():
        status = "✅ 존재함" if data["exists"] else "❌ 존재하지 않음"
        print(f"{endpoint}: {status} (상태코드: {data['status']})")
    
    # 회원가입 테스트
    registration_data = test_register()
    
    # 등록 성공 시 해당 계정으로 로그인, 아니면 기존 계정으로 시도
    site_id = None
    if registration_data and "site_id" in registration_data:
        site_id = registration_data["site_id"]
        print(f"✅ 생성된 사이트 ID: {site_id}")
    
    # 로그인 테스트
    access_token = test_login(site_id)
    
    # 프로필 테스트
    if access_token:
        test_profile(access_token)
    
    print("\n🏁 테스트 완료")

if __name__ == "__main__":
    main()
