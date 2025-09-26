#!/usr/bin/env python3
# pyright: reportArgumentType=false
"""
상점 거래 E2E 플로우 실제 테스트 스크립트
API 호출 + DB 상태 검증을 통한 전체 거래 플로우 검증
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
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

class ShopE2ETest:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.test_products = []
        
    def log(self, message: str):
        """로그 출력"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def get_db_connection(self):
        """DB 연결"""
        return psycopg2.connect(**DB_CONFIG)
        
    def db_query(self, query: str, params=None) -> list:
        """DB 쿼리 실행"""
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                if query.strip().upper().startswith('SELECT'):
                    return cur.fetchall()
                conn.commit()
                return []
    
    def create_test_user(self, nickname_prefix: str = "shop_test") -> tuple[str, int]:
        """테스트 사용자 생성"""
        unique_id = str(uuid.uuid4())[:8]
        nickname = f"{nickname_prefix}_{unique_id}"
        
        payload = {
            'invite_code': '5858',
            'nickname': nickname,
            'site_id': f"test_{unique_id}",
            'phone_number': f"010{unique_id[:8]}",
            'password': 'test1234'
        }
        
        response = self.session.post(f"{API_BASE}/api/auth/signup", json=payload)
        if not response.ok:
            raise Exception(f"회원가입 실패: {response.status_code} - {response.text}")
        
        data = response.json()
        token = data['access_token']
        user_id = data['user']['id']
        
        self.log(f"사용자 생성 완료: {nickname} (ID: {user_id})")
        return token, user_id
    
    def elevate_to_admin(self, site_id: str):
        """관리자 권한 부여"""
        try:
            response = self.session.post(f"{API_BASE}/api/admin/users/elevate", 
                                       json={'site_id': site_id})
            if response.ok:
                self.log(f"관리자 권한 부여 성공: {site_id}")
            else:
                self.log(f"관리자 권한 부여 실패 (무시): {response.status_code}")
        except Exception as e:
            self.log(f"관리자 권한 부여 중 오류 (무시): {e}")
    
    def get_user_profile(self, token: str) -> dict:
        """사용자 프로필 조회"""
        headers = {'Authorization': f'Bearer {token}'}
        response = self.session.get(f"{API_BASE}/api/auth/me", headers=headers)
        if not response.ok:
            raise Exception(f"프로필 조회 실패: {response.status_code}")
        return response.json()
    
    def add_tokens_to_user(self, user_id: int, amount: int):
        """사용자에게 토큰 추가 (DB 직접 조작)"""
        query = """
        UPDATE users 
        SET cyber_token_balance = COALESCE(cyber_token_balance, 0) + %s 
        WHERE id = %s
        """
        self.db_query(query, (amount, user_id))
        self.log(f"사용자 {user_id}에게 {amount} 토큰 추가")
    
    def create_test_product(self, product_id: str, name: str, price: int):
        """테스트 상품 생성"""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        payload = {
            'product_id': product_id,
            'name': name,
            'price': price,
            'description': f'E2E 테스트용 상품 - {name}'
        }
        
        response = self.session.post(f"{API_BASE}/api/shop/admin/products", 
                                   headers=headers, json=payload)
        if response.ok:
            self.log(f"테스트 상품 생성 성공: {product_id}")
            self.test_products.append(product_id)
        else:
            self.log(f"테스트 상품 생성 실패: {response.status_code} - {response.text}")
    
    def get_user_balance(self, user_id: int) -> int:
        """사용자 잔액 조회 (DB)"""
        query = "SELECT gold_balance FROM users WHERE id = %s"
        result = self.db_query(query, (user_id,))
        return result[0]['gold_balance'] if result else 0
    
    def buy_item(self, product_id: str, price: int, idempotency_key: str = None) -> dict:
        """아이템 구매"""
        if not idempotency_key:
            idempotency_key = str(uuid.uuid4())
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        payload = {
            'user_id': self.user_id,
            'product_id': product_id,
            'amount': price,
            'quantity': 1,
            'kind': 'item',
            'payment_method': 'tokens',
            'idempotency_key': idempotency_key
        }
        
        response = self.session.post(f"{API_BASE}/api/shop/buy", 
                                   headers=headers, json=payload)
        
        if response.ok:
            data = response.json()
            self.log(f"구매 요청: {product_id} - 성공: {data.get('success')}")
            return data
        else:
            self.log(f"구매 실패: {response.status_code} - {response.text}")
            return {'success': False, 'message': response.text}
    
    def get_transactions(self, user_id: int = None) -> list:
        """거래 내역 조회"""
        target_user = user_id or self.user_id
        headers = {'Authorization': f'Bearer {self.user_token}'}
        response = self.session.get(f"{API_BASE}/api/shop/transactions?user_id={target_user}", 
                                  headers=headers)
        if response.ok:
            return response.json()
        return []
    
    def verify_transaction_in_db(self, user_id: int, product_id: str, expected_amount: int) -> bool:
        """DB에서 거래 기록 확인"""
        query = """
        SELECT * FROM shop_transactions 
        WHERE user_id = %s AND product_id = %s AND amount = %s AND status = 'success'
        ORDER BY created_at DESC LIMIT 1
        """
        result = self.db_query(query, (user_id, product_id, expected_amount))
        return len(result) > 0
    
    def verify_user_action_log(self, user_id: int, action_type: str, product_id: str) -> bool:
        """UserAction 로그 확인"""
        query = """
        SELECT * FROM user_actions 
        WHERE user_id = %s AND action_type = %s 
        AND action_data::text LIKE %s
        ORDER BY created_at DESC LIMIT 1
        """
        result = self.db_query(query, (user_id, action_type, f'%{product_id}%'))
        return len(result) > 0
    
    def test_idempotency(self, product_id: str, price: int):
        """멱등성 테스트"""
        self.log("\n=== 멱등성 테스트 시작 ===")
        
        # 초기 잔액 확인
        initial_balance = self.get_user_balance(self.user_id)
        self.log(f"초기 잔액: {initial_balance}")
        
        # 첫 번째 구매
        idempotency_key = str(uuid.uuid4())
        result1 = self.buy_item(product_id, price, idempotency_key)
        
        # 잔액 확인
        balance_after_1st = self.get_user_balance(self.user_id)
        self.log(f"첫 구매 후 잔액: {balance_after_1st}")
        
        # 동일한 멱등성 키로 재구매
        result2 = self.buy_item(product_id, price, idempotency_key)
        
        # 최종 잔액 확인
        final_balance = self.get_user_balance(self.user_id)
        self.log(f"재구매 후 잔액: {final_balance}")
        
        # 검증
        if result1.get('success') and result2.get('success'):
            receipt1 = result1.get('receipt_code')
            receipt2 = result2.get('receipt_code')
            
            if receipt1 == receipt2:
                self.log("✓ 멱등성 테스트 성공: 동일한 영수증 코드 반환")
            else:
                self.log("✗ 멱등성 테스트 실패: 다른 영수증 코드")
            
            if balance_after_1st == final_balance:
                self.log("✓ 잔액 멱등성 성공: 중복 차감 없음")
            else:
                self.log("✗ 잔액 멱등성 실패: 중복 차감 발생")
        
        return result1, result2
    
    def test_insufficient_balance(self):
        """잔액 부족 테스트"""
        self.log("\n=== 잔액 부족 테스트 시작 ===")
        
        current_balance = self.get_user_balance(self.user_id)
        excessive_price = current_balance + 10000
        
        result = self.buy_item("expensive_test_item", excessive_price)
        
        if not result.get('success'):
            self.log("✓ 잔액 부족 테스트 성공: 구매 차단됨")
        else:
            self.log("✗ 잔액 부족 테스트 실패: 구매가 성공함")
        
        return result
    
    def run_complete_flow_test(self):
        """전체 플로우 테스트 실행"""
        self.log("=== 상점 거래 E2E 플로우 테스트 시작 ===")
        
        try:
            # 1. 사용자 생성 및 설정
            self.log("\n--- Phase 1: 사용자 설정 ---")
            self.user_token, self.user_id = self.create_test_user("shop_test")
            self.admin_token, self.admin_id = self.create_test_user("admin_test")
            
            # 관리자 권한 부여
            admin_profile = self.get_user_profile(self.admin_token)
            self.elevate_to_admin(admin_profile['site_id'])
            
            # 사용자에게 초기 토큰 부여
            self.add_tokens_to_user(self.user_id, 50000)
            
            # 2. 테스트 상품 생성
            self.log("\n--- Phase 2: 테스트 상품 생성 ---")
            test_products = [
                ("test_item_1", "테스트 아이템 1", 1000),
                ("test_item_2", "테스트 아이템 2", 2000),
                ("test_expensive", "비싼 아이템", 45000)
            ]
            
            for product_id, name, price in test_products:
                self.create_test_product(product_id, name, price)
            
            # 3. 정상 구매 테스트
            self.log("\n--- Phase 3: 정상 구매 테스트 ---")
            initial_balance = self.get_user_balance(self.user_id)
            self.log(f"구매 전 잔액: {initial_balance}")
            
            purchase_result = self.buy_item("test_item_1", 1000)
            
            if purchase_result.get('success'):
                self.log("✓ 정상 구매 성공")
                
                # 잔액 확인
                new_balance = self.get_user_balance(self.user_id)
                expected_balance = initial_balance - 1000
                
                if new_balance == expected_balance:
                    self.log("✓ 잔액 차감 정확")
                else:
                    self.log(f"✗ 잔액 차감 오류: 예상 {expected_balance}, 실제 {new_balance}")
                
                # DB 기록 확인
                if self.verify_transaction_in_db(self.user_id, "test_item_1", 1000):
                    self.log("✓ ShopTransaction 기록 확인")
                else:
                    self.log("✗ ShopTransaction 기록 없음")
                
                if self.verify_user_action_log(self.user_id, "BUY_PACKAGE", "test_item_1"):
                    self.log("✓ UserAction 로그 확인")
                else:
                    self.log("✗ UserAction 로그 없음")
            
            # 4. 멱등성 테스트
            self.test_idempotency("test_item_2", 2000)
            
            # 5. 잔액 부족 테스트
            self.test_insufficient_balance()
            
            # 6. 거래 내역 조회 테스트
            self.log("\n--- Phase 6: 거래 내역 조회 ---")
            transactions = self.get_transactions()
            self.log(f"거래 내역 수: {len(transactions)}")
            
            for tx in transactions[:3]:  # 최근 3개만 출력
                self.log(f"거래: {tx.get('product_id')} - {tx.get('amount')}토큰 - {tx.get('status')}")
            
            # 7. 최종 잔액 일치성 검증
            self.log("\n--- Phase 7: 잔액 일치성 검증 ---")
            final_balance = self.get_user_balance(self.user_id)
            
            # DB에서 총 지출 계산
            spent_query = """
            SELECT COALESCE(SUM(amount), 0) as total_spent 
            FROM shop_transactions 
            WHERE user_id = %s AND status = 'success' AND kind = 'item'
            """
            spent_result = self.db_query(spent_query, (self.user_id,))
            total_spent = spent_result[0]['total_spent'] if spent_result else 0
            
            expected_final = 50000 - total_spent  # 초기 50000 - 총지출
            
            self.log(f"최종 잔액: {final_balance}")
            self.log(f"총 지출: {total_spent}")
            self.log(f"예상 잔액: {expected_final}")
            
            if final_balance == expected_final:
                self.log("✓ 최종 잔액 일치성 검증 성공")
            else:
                self.log("✗ 최종 잔액 불일치")
            
            self.log("\n=== 상점 거래 E2E 플로우 테스트 완료 ===")
            
        except Exception as e:
            self.log(f"테스트 중 오류 발생: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            # 정리 작업
            self.cleanup()
    
    def cleanup(self):
        """테스트 데이터 정리"""
        self.log("\n--- 정리 작업 시작 ---")
        
        # 테스트 상품 삭제
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            for product_id in self.test_products:
                try:
                    response = self.session.delete(f"{API_BASE}/api/shop/admin/products/{product_id}", 
                                                 headers=headers)
                    if response.ok:
                        self.log(f"테스트 상품 삭제: {product_id}")
                except Exception as e:
                    self.log(f"상품 삭제 오류: {product_id} - {e}")
        
        self.log("정리 작업 완료")

if __name__ == "__main__":
    test = ShopE2ETest()
    test.run_complete_flow_test()