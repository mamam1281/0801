#!/usr/bin/env python3
"""
Shop Service 테스트 스크립트
기존 상품 보존 확인 및 관리자 기능 검증
"""
from app.database import get_db
from app.services.shop_service import ShopService
import asyncio

async def test_shop_service():
    db = next(get_db())
    shop_service = ShopService(db)
    
    print("=== 기존 상품 보존 확인 ===")
    existing_products = await shop_service.get_existing_products_info()
    print(f"총 {len(existing_products)}개 상품 발견:")
    for product in existing_products:
        original_mark = "[기존]" if product["is_original"] else "[신규]"
        print(f"{original_mark} {product['id']}: {product['name']} - {product['price']}원")
    
    print("\n=== 상점 통계 ===")
    stats = await shop_service.get_shop_stats()
    print(f"전체 상품: {stats['total_products']}개")
    print(f"활성 상품: {stats['active_products']}개")
    print(f"비활성 상품: {stats['inactive_products']}개")
    
    print("\n=== 카테고리 목록 ===")
    categories = await shop_service.get_categories()
    print(f"카테고리: {categories}")
    
    # 상품 목록 조회 테스트
    print("\n=== 상품 목록 조회 테스트 ===")
    products, total = await shop_service.get_products_list(skip=0, limit=5)
    print(f"처음 5개 상품 (총 {total}개):")
    for product in products:
        print(f"- {product['name']}: {product['price']}원 (활성: {product['is_active']})")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_shop_service())
