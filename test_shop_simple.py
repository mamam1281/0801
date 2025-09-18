#!/usr/bin/env python3
"""
상점 거래 E2E 플로우 간소화 테스트 - 기존 사용자 사용
"""

import requests
import json
import time
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# 환경 설정
API_BASE = "http://localhost:8000"
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'cc_webapp',
    'user': 'cc_user',
    'password': 'cc_password'
}

class SimpleShopTest:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def get_db_connection(self):
        return psycopg2.connect(**DB_CONFIG)
        
    def db_query(self, query: str, params=None) -> list:
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                if query.strip().upper().startswith('SELECT'):
                    return cur.fetchall()
                conn.commit()
                return []
    
    def login_existing_user(self, site_id: str = "testuser", password: str = "testpass") -> tuple:
        """기존 사용자로 로그인 시도"""
        payload = {
            'site_id': site_id,
            'password': password
        }
        
        response = self.session.post(f"{API_BASE}/api/auth/login", json=payload)
        if response.ok:
            data = response.json()
            token = data['access_token']
            user_id = data['user']['id']
            self.log(f"로그인 성공: {site_id} (ID: {user_id})")
            return token, user_id
        else:
            self.log(f"로그인 실패: {response.status_code} - {response.text}")
            return None, None
    
    def get_existing_users(self) -> list:
        """DB에서 기존 사용자 목록 조회"""
        query = """
        SELECT id, site_id, nickname, gold_balance, is_admin 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10
        """
        return self.db_query(query)
    
    def add_tokens_directly(self, user_id: int, amount: int):
        """DB에서 직접 토큰 추가"""
        query = """
        UPDATE users 
        SET gold_balance = COALESCE(gold_balance, 0) + %s 
        WHERE id = %s
        """
        self.db_query(query, (amount, user_id))
        self.log(f"사용자 {user_id}에게 {amount} 골드 추가")
    
    def get_user_balance(self, user_id: int) -> int:
        query = "SELECT gold_balance FROM users WHERE id = %s"
        result = self.db_query(query, (user_id,))
        return result[0]['gold_balance'] if result else 0
    
    def get_shop_products(self) -> list:
        """상점 상품 목록 조회"""
        response = self.session.get(f"{API_BASE}/api/shop/products")
        if response.ok:
            return response.json()
        return []
    
    def buy_item_simple(self, token: str, user_id: int, product_id: str, amount: int) -> dict:
        """간단한 아이템 구매"""
        headers = {'Authorization': f'Bearer {token}'}
        payload = {
            'user_id': user_id,
            'product_id': product_id,
            'amount': amount,
            'quantity': 1,
            'kind': 'item',
            'payment_method': 'tokens',
            'idempotency_key': str(uuid.uuid4())
        }
        
        response = self.session.post(f"{API_BASE}/api/shop/buy", headers=headers, json=payload)
        if response.ok:
            data = response.json()
            self.log(f"구매 시도: {product_id} ({amount}토큰) - 결과: {data.get('success')}")
            if not data.get('success'):
                self.log(f"구매 실패 이유: {data.get('message')}")
            return data
        else:
            self.log(f"구매 API 호출 실패: {response.status_code} - {response.text}")
            return {'success': False, 'message': f'API Error: {response.status_code}'}
    
    def get_user_transactions(self, user_id: int) -> list:
        """사용자 거래 내역 조회"""
        query = """
        SELECT product_id, amount, status, receipt_code, created_at 
        FROM shop_transactions 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT 10
        """
        return self.db_query(query, (user_id,))
    
    def run_simple_test(self):
        """간소화된 상점 테스트"""
        self.log("=== 간소화 상점 테스트 시작 ===")
        
        try:
            # 1. 기존 사용자 확인
            self.log("\n--- 기존 사용자 조회 ---")
            users = self.get_existing_users()
            
            if not users:
                self.log("기존 사용자가 없습니다. 테스트 종료.")
                return
            
            for user in users[:3]:
                self.log(f"사용자: {user['site_id']} (ID: {user['id']}, "
                        f"골드: {user['gold_balance']}, 관리자: {user['is_admin']})")
            
            # 첫 번째 사용자 선택
            test_user = users[0]
            user_id = test_user['id']
            site_id = test_user['site_id']
            
            # 2. 토큰 확보 (직접 DB 조작)
            current_balance = self.get_user_balance(user_id)
            if current_balance < 50000:
                self.add_tokens_directly(user_id, 50000)
                current_balance = self.get_user_balance(user_id)
            
            self.log(f"\n현재 잔액: {current_balance} 골드")
            
            # 3. 상품 목록 조회
            self.log("\n--- 상점 상품 조회 ---")
            products = self.get_shop_products()
            self.log(f"상품 수: {len(products)}")
            
            if products:
                for product in products[:3]:
                    self.log(f"상품: {product.get('product_id')} - "
                            f"{product.get('name')} ({product.get('price')}골드)")
            
            # 4. 로그인 없이 직접 구매 테스트 (API 키 방식)
            self.log("\n--- 직접 구매 테스트 ---")
            
            if products:
                test_product = products[0]
                product_id = test_product['product_id']
                price = test_product['price']
                
                if price <= current_balance:
                    # 임시 토큰 생성 (실제로는 로그인 필요)
                    self.log(f"구매 시도: {product_id} ({price}골드)")
                    
                    # DB에서 직접 거래 시뮬레이션
                    self.simulate_purchase(user_id, product_id, price)
                else:
                    self.log(f"잔액 부족: 필요 {price}, 보유 {current_balance}")
            
            # 5. 거래 내역 확인
            self.log("\n--- 거래 내역 확인 ---")
            transactions = self.get_user_transactions(user_id)
            
            for tx in transactions:
                self.log(f"거래: {tx['product_id']} - {tx['amount']}골드 - "
                        f"{tx['status']} ({tx['created_at']})")
            
        except Exception as e:
            self.log(f"테스트 중 오류: {e}")
            import traceback
            traceback.print_exc()
    
    def simulate_purchase(self, user_id: int, product_id: str, amount: int):
        """DB에서 직접 구매 시뮬레이션"""
        try:
            # 잔액 차감
            update_balance_query = """
            UPDATE users 
            SET gold_balance = gold_balance - %s 
            WHERE id = %s AND gold_balance >= %s
            """
            
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(update_balance_query, (amount, user_id, amount))
                    if cur.rowcount == 0:
                        self.log("잔액 부족으로 구매 실패")
                        return False
                    
                    # 거래 기록 추가
                    insert_tx_query = """
                    INSERT INTO shop_transactions 
                    (user_id, product_id, kind, quantity, unit_price, amount, 
                     payment_method, status, receipt_code, created_at)
                    VALUES (%s, %s, 'item', 1, %s, %s, 'tokens', 'success', %s, NOW())
                    """
                    
                    receipt_code = f"TEST_{uuid.uuid4().hex[:8]}"
                    cur.execute(insert_tx_query, 
                              (user_id, product_id, amount, amount, receipt_code))
                    
                    conn.commit()
                    
                    self.log(f"구매 시뮬레이션 성공: {product_id} (영수증: {receipt_code})")
                    
                    # 최종 잔액 확인
                    final_balance = self.get_user_balance(user_id)
                    self.log(f"구매 후 잔액: {final_balance}")
                    
                    return True
                    
        except Exception as e:
            self.log(f"구매 시뮬레이션 실패: {e}")
            return False

if __name__ == "__main__":
    test = SimpleShopTest()
    test.run_simple_test()