"""
JWT 토큰 생성 및 API 테스트 도구
"""
import requests
import json
from datetime import datetime

class AdminAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.headers = {"Content-Type": "application/json"}
    
    def login(self, email="admin@casino-club.com", password="admin123!"):
        """관리자 로그인"""
        print(f"🔐 로그인 시도: {email}")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.headers["Authorization"] = f"Bearer {self.token}"
                print("✅ 로그인 성공!")
                print(f"🔑 토큰: {self.token[:50]}...")
                return True
            else:
                print(f"❌ 로그인 실패: {response.status_code}")
                print(f"응답: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 로그인 오류: {str(e)}")
            return False
    
    def test_shop_stats(self):
        """상점 통계 API 테스트"""
        print("\n📊 상점 통계 API 테스트")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/shop/stats",
                headers=self.headers
            )
            
            print(f"상태 코드: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("✅ 통계 조회 성공!")
                print(json.dumps(data, indent=2, ensure_ascii=False))
            else:
                print(f"❌ 통계 조회 실패: {response.text}")
                
        except Exception as e:
            print(f"❌ 통계 API 오류: {str(e)}")
    
    def test_shop_products(self):
        """상품 목록 API 테스트"""
        print("\n🛍️ 상품 목록 API 테스트")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/shop/products?limit=5",
                headers=self.headers
            )
            
            print(f"상태 코드: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("✅ 상품 목록 조회 성공!")
                print(f"총 상품 수: {data.get('total', 0)}")
                products = data.get('products', [])
                for product in products[:3]:  # 처음 3개만 표시
                    print(f"- {product.get('name')} (ID: {product.get('product_id')}) - ₩{product.get('price'):,}")
            else:
                print(f"❌ 상품 목록 조회 실패: {response.text}")
                
        except Exception as e:
            print(f"❌ 상품 목록 API 오류: {str(e)}")
    
    def test_product_activation(self, product_id=1):
        """상품 활성화/비활성화 테스트"""
        print(f"\n🔄 상품 {product_id} 활성화/비활성화 테스트")
        
        try:
            # 비활성화 테스트
            response = requests.post(
                f"{self.base_url}/api/admin/shop/products/{product_id}/deactivate",
                headers=self.headers
            )
            print(f"비활성화 상태 코드: {response.status_code}")
            
            # 활성화 테스트
            response = requests.post(
                f"{self.base_url}/api/admin/shop/products/{product_id}/activate",
                headers=self.headers
            )
            print(f"활성화 상태 코드: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ 상품 상태 변경 성공!")
            else:
                print(f"❌ 상품 상태 변경 실패: {response.text}")
                
        except Exception as e:
            print(f"❌ 상품 상태 변경 오류: {str(e)}")
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("=" * 60)
        print("🧪 관리자 API 테스트 시작")
        print("=" * 60)
        
        # 로그인
        if not self.login():
            print("❌ 로그인에 실패하여 테스트를 중단합니다.")
            return
        
        # API 테스트들
        self.test_shop_stats()
        self.test_shop_products()
        self.test_product_activation()
        
        print("\n" + "=" * 60)
        print("🎉 테스트 완료!")
        print("=" * 60)

if __name__ == "__main__":
    tester = AdminAPITester()
    tester.run_all_tests()
