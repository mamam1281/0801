#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
고정 초대코드 테스트 스크립트
새로 설정된 고정 초대코드 (5882, 6969, 6974)로 API 테스트 수행
"""

import pytest
import requests
import json

BASE_URL = "http://139.180.155.143:8000"

@pytest.mark.skip(reason="외부 서버 연결 테스트 - 배포 시 제외")
def test_fixed_invite_codes():
    """고정 초대코드를 사용한 회원가입 테스트"""
    print("🎫 고정 초대코드 테스트 시작")
    print("="*60)
    
    fixed_codes = ["5882", "6969", "6974"]
    
    # 각 고정 초대코드로 회원가입 테스트
    for i, invite_code in enumerate(fixed_codes, 1):
        print(f"\n📋 테스트 {i}: 초대코드 {invite_code} 사용")
        
        # 회원가입 데이터
        signup_data = {
            "site_id": f"testuser{i}",
            "nickname": f"테스트유저{i}",
            "phone_number": f"010-1234-567{i}",
            "password": "test123!",
            "invite_code": invite_code
        }
        
        # 회원가입 요청
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json=signup_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 회원가입 성공: {result['message']}")
            
            # 로그인 테스트
            login_data = {
                "site_id": signup_data["site_id"],
                "password": signup_data["password"]
            }
            
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json=login_data
            )
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                print(f"✅ 로그인 성공: {login_result['message']}")
            else:
                print(f"❌ 로그인 실패: {login_response.json()}")
        else:
            print(f"❌ 회원가입 실패: {response.json()}")

def test_invalid_invite_code():
    """잘못된 초대코드 테스트"""
    print("\n🚫 잘못된 초대코드 테스트")
    print("-"*40)
    
    signup_data = {
        "site_id": "invalidtest",
        "nickname": "무효테스트",
        "phone_number": "010-9999-9999",
        "password": "test123!",
        "invite_code": "1111"  # 존재하지 않는 초대코드
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data
    )
    
    if response.status_code != 200:
        print(f"✅ 예상대로 실패: {response.json()['detail']}")
    else:
        print(f"❌ 예상과 다름: 회원가입이 성공했습니다")

def test_duplicate_signup():
    """중복 회원가입 방지 테스트"""
    print("\n🔒 중복 회원가입 방지 테스트")
    print("-"*40)
    
    # 같은 site_id로 다시 회원가입 시도
    signup_data = {
        "site_id": "testuser1",  # 이미 사용된 site_id
        "nickname": "중복테스트",
        "phone_number": "010-8888-8888",
        "password": "test123!",
        "invite_code": "6969"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data
    )
    
    if response.status_code != 200:
        print(f"✅ 예상대로 실패: {response.json()['detail']}")
    else:
        print(f"❌ 예상과 다름: 중복 회원가입이 성공했습니다")

def main():
    """메인 테스트 실행"""
    print("🧪 Phase D - 고정 초대코드 통합 테스트")
    print("="*60)
    
    try:
        # 서버 연결 확인
        health_response = requests.get(f"{BASE_URL}/health")
        if health_response.status_code != 200:
            print("❌ 서버 연결 실패")
            return
        
        print("✅ 서버 연결 확인")
        
        # 테스트 실행
        test_fixed_invite_codes()
        test_invalid_invite_code()
        test_duplicate_signup()
        
        print("\n🎉 모든 테스트 완료!")
        
    except requests.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")

if __name__ == "__main__":
    main()
