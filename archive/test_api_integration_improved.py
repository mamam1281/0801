#!/usr/bin/env python3
"""
Phase D: 백엔???�론?�엔???�합 ?�스??(개선??버전)
- 고유???�스???�이???�용
- ?�체 ?�원가????로그???�로???�스??
- ?�러 케?�스 검�?
"""

import pytest
import requests
import json
import time
import random
import string
from datetime import datetime

# ?�버 ?�정
BASE_URL = "http://127.0.0.1:8001"

def generate_unique_id(prefix="test"):
    """고유???�스??ID ?�성"""
    timestamp = int(time.time() * 1000)  # 밀리초
    random_suffix = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"{prefix}{timestamp}{random_suffix}"

@pytest.mark.skip(reason=" �ܺ� ���� ���� �׽�Ʈ - ���� �� ����\)
def test_health_check():
    """?�버 ?�태 ?�인"""
    print("?�� ?�버 ?�태 ?�인...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("???�버 ?�태: ?�상")
            return True
        else:
            print(f"???�버 ?�태: ?�류 {response.status_code}")
            return False
    except Exception as e:
        print(f"???�버 ?�결 ?�패: {e}")
        return False

@pytest.mark.skip(reason=" �ܺ� ���� ���� �׽�Ʈ - ���� �� ����\)
def test_invite_code_generation():
    """초�?코드 ?�성 ?�스??""
    print("\n?�� 초�?코드 ?�성 ?�스??..")
    try:
        response = requests.post(f"{BASE_URL}/api/admin/invite-codes", 
                                json={"count": 1}, timeout=10)
        if response.status_code == 200:
            data = response.json()
            invite_code = data["codes"][0]
            print(f"??초�?코드 ?�성: {invite_code}")
            return invite_code
        else:
            print(f"??초�?코드 ?�성 ?�패: {response.status_code}")
            return None
    except Exception as e:
        print(f"??초�?코드 ?�성 ?�류: {e}")
        return None

@pytest.mark.skip(reason=" �ܺ� ���� ���� �׽�Ʈ - ���� �� ����\)
def test_complete_user_flow():
    """?�전???�용???�로???�스?? 초�?코드 ???�원가????로그??""
    print("\n?? ?�전???�용???�로???�스???�작...")
    
    # 1. 초�?코드 ?�성
    invite_code = test_invite_code_generation()
    if not invite_code:
        return False
    
    # 2. 고유???�스???�이???�성
    unique_site_id = generate_unique_id("user")
    test_data = {
        "site_id": unique_site_id,
        "nickname": f"?�스?�유?�_{int(time.time())}",
        "phone_number": f"010-{random.randint(1000,9999)}-{random.randint(1000,9999)}",
        "password": "test123!@#",
        "invite_code": invite_code
    }
    
    print(f"?�� ?�스???�이?? {test_data['site_id']}, {test_data['nickname']}, {test_data['phone_number']}")
    
    # 3. ?�원가???�스??
    print("\n?�� ?�원가???�스??..")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signup", 
                                json=test_data, timeout=10)
        if response.status_code == 200:
            signup_data = response.json()
            print(f"???�원가???�공: {signup_data.get('message', '?�공')}")
            user_id = signup_data.get('user_id')
            print(f"   ?�용??ID: {user_id}")
        else:
            error_data = response.json()
            print(f"???�원가???�패: {response.status_code}")
            print(f"   ?�류 ?�용: {error_data.get('detail', '?????�음')}")
            return False
    except Exception as e:
        print(f"???�원가???�류: {e}")
        return False
    
    # 4. 로그???�스??
    print("\n?�� 로그???�스??..")
    login_data = {
        "site_id": test_data["site_id"],
        "password": test_data["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", 
                                json=login_data, timeout=10)
        if response.status_code == 200:
            login_response = response.json()
            print(f"??로그???�공: {login_response.get('user', {}).get('nickname', 'Unknown')}")
            print(f"   ?�큰 ?�?? {login_response.get('token_type', 'Unknown')}")
            return True
        else:
            error_data = response.json()
            print(f"??로그???�패: {response.status_code}")
            print(f"   ?�류 ?�용: {error_data.get('detail', '?????�음')}")
            return False
    except Exception as e:
        print(f"??로그???�류: {e}")
        return False

@pytest.mark.skip(reason=" �ܺ� ���� ���� �׽�Ʈ - ���� �� ����\)
def test_error_cases():
    """?�러 케?�스 ?�스??""
    print("\n?�� ?�러 케?�스 ?�스??..")
    
    # 1. ?�못??초�?코드�??�원가??
    print("1️⃣ ?�못??초�?코드 ?�스??..")
    invalid_signup = {
        "site_id": generate_unique_id("invalid"),
        "nickname": "?�못?�초?�코드",
        "phone_number": "010-0000-0000",
        "password": "test123",
        "invite_code": "INVALID123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signup", 
                                json=invalid_signup, timeout=10)
        if response.status_code == 400:
            print("???�못??초�?코드 거�???)
        else:
            print(f"???�상�??�른 ?�답: {response.status_code}")
    except Exception as e:
        print(f"???�스???�류: {e}")
    
    # 2. 존재?��? ?�는 ?�용??로그??
    print("2️⃣ 존재?��? ?�는 ?�용??로그???�스??..")
    invalid_login = {
        "site_id": "nonexistent_user_12345",
        "password": "anypassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", 
                                json=invalid_login, timeout=10)
        if response.status_code == 401:
            print("??존재?��? ?�는 ?�용??로그??거�???)
        else:
            print(f"???�상�??�른 ?�답: {response.status_code}")
    except Exception as e:
        print(f"???�스???�류: {e}")

def main():
    """메인 ?�스???�행"""
    print("?�� Phase D: 백엔???�론?�엔???�합 ?�스??(개선??버전)")
    print("=" * 60)
    print(f"???�스???�작 ?�간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # ?�버 ?�태 ?�인
    if not test_health_check():
        print("???�버가 ?�행?��? ?�았?�니?? test_server_phase_d.py�?먼�? ?�행?�세??")
        return
    
    # ?�전???�용???�로???�스??
    flow_success = test_complete_user_flow()
    
    # ?�러 케?�스 ?�스??
    test_error_cases()
    
    # 결과 ?�약
    print("\n" + "=" * 60)
    print("?�� ?�스??결과 ?�약")
    print("=" * 60)
    if flow_success:
        print("???�체 ?�용???�로?? ?�공")
        print("??Phase D ?�합 ?�스?? ?�료")
        print("\n?�� 모든 ?�스?��? ?�공?�습?�다!")
        print("?�� ?�음 ?�계: ?�론?�엔???�과 백엔??API ?�동 ?�스??)
    else:
        print("???�체 ?�용???�로?? ?�패")
        print("??Phase D ?�합 ?�스?? 미완�?)
        print("\n?�� 문제�??�결?????�시 ?�스?�하?�요.")
    
    print(f"???�스???�료 ?�간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
