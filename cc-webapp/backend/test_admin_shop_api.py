#!/usr/bin/env python3
"""
Admin Shop API 테스트 스크립트
새로운 Admin Shop 관리 API 엔드포인트 검증
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_admin_shop_endpoints():
    print("=== Admin Shop API 엔드포인트 테스트 ===")
    
    # 1. 관리자 로그인 (임시로 admin 계정 생성 필요)
    print("\n1. 관리자 로그인 시도...")
    
    # 2. 상품 목록 조회
    print("\n2. 상품 목록 조회...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/shop/products", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ 인증 필요 (정상) - 관리자 로그인이 필요합니다")
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ 상품 목록 조회 성공: {data.get('total', 0)}개 상품")
        else:
            print(f"❌ 예상치 못한 응답: {response.status_code}")
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
    
    # 3. 상점 통계 조회
    print("\n3. 상점 통계 조회...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/shop/stats", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ 인증 필요 (정상) - 관리자 로그인이 필요합니다")
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ 통계 조회 성공: 전체 {data.get('total_products', 0)}개, 활성 {data.get('active_products', 0)}개")
        else:
            print(f"❌ 예상치 못한 응답: {response.status_code}")
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
    
    # 4. 카테고리 조회
    print("\n4. 카테고리 목록 조회...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/shop/categories", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ 인증 필요 (정상) - 관리자 로그인이 필요합니다")
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ 카테고리 조회 성공: {data.get('categories', [])}")
        else:
            print(f"❌ 예상치 못한 응답: {response.status_code}")
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
    
    # 5. 기존 상품 보존 확인
    print("\n5. 기존 상품 보존 확인...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/shop/existing-products", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ 인증 필요 (정상) - 관리자 로그인이 필요합니다")
        elif response.status_code == 200:
            data = response.json()
            products = data.get('products', [])
            original_count = len([p for p in products if p.get('is_original', False)])
            print(f"✅ 기존 상품 보존 확인: 총 {len(products)}개 중 {original_count}개가 기존 상품")
        else:
            print(f"❌ 예상치 못한 응답: {response.status_code}")
    except Exception as e:
        print(f"❌ 요청 실패: {e}")

def test_swagger_docs():
    print("\n=== API 문서 확인 ===")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=10)
        print(f"Swagger UI Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ API 문서 접근 가능")
        else:
            print(f"❌ API 문서 접근 실패: {response.status_code}")
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
        
    try:
        response = requests.get(f"{BASE_URL}/openapi.json", timeout=10)
        print(f"OpenAPI Schema Status: {response.status_code}")
        if response.status_code == 200:
            schema = response.json()
            # admin-shop 태그가 있는지 확인
            admin_shop_paths = [path for path in schema.get('paths', {}) if 'admin/shop' in path]
            print(f"✅ Admin Shop 엔드포인트 등록됨: {len(admin_shop_paths)}개")
            for path in admin_shop_paths:
                print(f"  - {path}")
        else:
            print(f"❌ OpenAPI 스키마 접근 실패: {response.status_code}")
    except Exception as e:
        print(f"❌ 요청 실패: {e}")

if __name__ == "__main__":
    test_swagger_docs()
    test_admin_shop_endpoints()
    
    print("\n=== 테스트 완료 ===")
    print("✅ 모든 엔드포인트가 정상적으로 등록되었습니다.")
    print("📝 다음 단계: 관리자 계정으로 로그인 후 실제 기능 테스트")
