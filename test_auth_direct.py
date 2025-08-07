#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Casino-Club F2P 인증 API 테스트
==================================

인증 시스템 직접 테스트를 위한 스크립트
"""

import requests
import json
import time
from datetime import datetime

# 테스트 설정
BASE_URL = "http://localhost:8000"

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
    response = requests.get(f"{BASE_URL}/health")
    print_response(response)
    return response.status_code == 200

def test_register():
    """회원가입 테스트"""
    print_header("회원가입 테스트")
    
    # 고유 닉네임을 위한 타임스탬프
    timestamp = int(datetime.now().timestamp())
    nickname = f"테스트사용자{timestamp}"
    
    # 회원가입 요청
    data = {
        "invite_code": "5858",
        "nickname": nickname
    }
    
    print(f"요청 데이터: {json.dumps(data, ensure_ascii=False)}")
    
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=data
    )
    
    print_response(response)
    
    # 토큰 저장
    if response.status_code == 200 or response.status_code == 201:
        return response.json()
    return None

def test_login(site_id=None):
    """로그인 테스트"""
    print_header("로그인 테스트")
    
    # 없으면 기본 테스트 계정 사용
    if not site_id:
        site_id = "test@casino-club.local"
    
    data = {"site_id": site_id}
    print(f"요청 데이터: {json.dumps(data, ensure_ascii=False)}")
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=data
    )
    
    print_response(response)
    
    # 토큰 저장
    if response.status_code == 200:
        return response.json()
    return None

def test_profile(token_data):
    """프로필 조회 테스트"""
    print_header("프로필 조회")
    
    if not token_data:
        print("❌ 토큰이 없습니다. 로그인이 필요합니다.")
        return False
    
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    response = requests.get(
        f"{BASE_URL}/api/auth/profile",
        headers=headers
    )
    
    print_response(response)
    return response.status_code == 200

def test_token_refresh(token_data):
    """토큰 갱신 테스트"""
    print_header("토큰 갱신 테스트")
    
    if not token_data:
        print("❌ 토큰이 없습니다. 로그인이 필요합니다.")
        return False
    
    data = {"refresh_token": token_data["refresh_token"]}
    response = requests.post(
        f"{BASE_URL}/api/auth/refresh",
        json=data
    )
    
    print_response(response)
    
    if response.status_code == 200:
        return response.json()
    return None

def test_logout(token_data):
    """로그아웃 테스트"""
    print_header("로그아웃 테스트")
    
    if not token_data:
        print("❌ 토큰이 없습니다. 로그인이 필요합니다.")
        return False
    
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    response = requests.post(
        f"{BASE_URL}/api/auth/logout",
        headers=headers
    )
    
    print_response(response)
    return response.status_code == 200

def main():
    print("\n🔐 인증 시스템 테스트 시작\n")
    
    # 헬스 체크
    if not test_health():
        print("❌ 백엔드 서비스에 연결할 수 없습니다.")
        return
    
    # 회원가입 테스트
    register_result = test_register()
    
    # 회원가입 성공했으면 등록된 계정으로 테스트 진행
    if register_result:
        print("✅ 회원가입 성공! 새로운 계정으로 테스트를 진행합니다.")
        user_id = register_result.get("user_id")
        
        # 로그인 테스트는 회원가입에서 받은 토큰 사용
        token_data = register_result
    else:
        print("⚠️ 회원가입 실패. 기본 테스트 계정으로 진행합니다.")
        # 기본 테스트 계정으로 로그인
        token_data = test_login()
    
    if not token_data:
        print("❌ 로그인에 실패했습니다. 테스트를 중단합니다.")
        return
    
    # 프로필 조회
    test_profile(token_data)
    
    # 토큰 갱신
    new_token_data = test_token_refresh(token_data)
    
    # 로그아웃 - 새 토큰이 있으면 새 토큰으로, 없으면 기존 토큰으로
    test_logout(new_token_data or token_data)
    
    print("\n🎉 인증 시스템 테스트 완료!\n")

if __name__ == "__main__":
    main()
