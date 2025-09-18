#!/usr/bin/env python3
import requests
import json
import sys

# 백엔드 URL
BASE_URL = "http://localhost:8000"

def test_login_and_shop():
    """로그인 후 상점 구매 테스트"""
    
    # 1. 로그인
    print("=== 1. 로그인 테스트 ===")
    login_data = {
        "site_id": "user001",
        "password": "123455"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"로그인 응답 상태: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result.get("access_token")
            user_id = login_result.get("user", {}).get("id")
            print(f"로그인 성공! User ID: {user_id}")
            print(f"Access Token: {access_token[:50]}...")
            
            # 2. 상점 구매 테스트
            print("\n=== 2. 상점 구매 테스트 ===")
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # 올바른 BuyRequest 형태로 구매 요청
            purchase_data = {
                "user_id": user_id,
                "product_id": "test_product_94441b72",
                "amount": 5000,
                "quantity": 1,
                "kind": "item",
                "payment_method": "tokens"
            }
            
            print(f"구매 요청 데이터: {json.dumps(purchase_data, indent=2)}")
            
            shop_response = requests.post(f"{BASE_URL}/api/shop/buy", json=purchase_data, headers=headers)
            print(f"상점 구매 응답 상태: {shop_response.status_code}")
            print(f"상점 구매 응답: {shop_response.text}")
            
        else:
            print(f"로그인 실패: {login_response.text}")
            
    except Exception as e:
        print(f"에러 발생: {str(e)}")

if __name__ == "__main__":
    test_login_and_shop()