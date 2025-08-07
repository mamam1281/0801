#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Casino-Club F2P 인증 API 간단 테스트
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

def test_signup():
    """회원가입 테스트"""
    print_header("회원가입 테스트")
    
    # 고유한 사용자 생성을 위해 타임스탬프 사용
    timestamp = int(datetime.now().timestamp())
    site_id = f"testuser{timestamp}"
    nickname = f"테스트{timestamp}"
    
    # 회원가입 요청
    data = {
        "invite_code": "5858",
        "nickname": nickname,
        "site_id": site_id
    }
    
    print(f"요청 데이터: {json.dumps(data, ensure_ascii=False)}")
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=data
    )
    
    print_response(response)
    
    if response.status_code == 200:
        print(f"✅ 회원가입 성공: {site_id}")
        return site_id
    else:
        print("❌ 회원가입 실패")
        return None

def test_login(site_id):
    """로그인 테스트"""
    print_header("로그인 테스트")
    
    if not site_id:
        print("❌ 로그인을 테스트할 사용자가 없습니다.")
        return None
    
    data = {
        "site_id": site_id
    }
    
    print(f"요청 데이터: {json.dumps(data, ensure_ascii=False)}")
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=data
    )
    
    print_response(response)
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get("access_token")
        print(f"✅ 로그인 성공, 토큰 수신: {access_token[:10]}...")
        return access_token
    else:
        print("❌ 로그인 실패")
        return None

def test_profile(token):
    """프로필 조회 테스트"""
    print_header("프로필 조회 테스트")
    
    if not token:
        print("❌ 프로필 조회를 테스트할 토큰이 없습니다.")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(
        f"{BASE_URL}/api/users/profile",
        headers=headers
    )
    
    print_response(response)
    
    if response.status_code == 200:
        print("✅ 프로필 조회 성공")
        return True
    else:
        print("❌ 프로필 조회 실패")
        return False

def main():
    """메인 테스트 실행"""
    print("\n🔐 Casino-Club F2P 인증 API 테스트 시작\n")
    
    # 서버 상태 확인
    if not test_health():
        print("\n❌ 헬스 체크 실패. 서버가 정상적으로 실행 중인지 확인하세요.")
        return
    
    # 회원가입
    site_id = test_signup()
    
    # 로그인
    token = test_login(site_id)
    
    # 프로필 조회
    if token:
        test_profile(token)
    
    print("\n🏁 테스트 완료")

if __name__ == "__main__":
    main()
