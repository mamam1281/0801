"""
Admin Shop Management Router
관리자용 상점 관리 API - 기존 상품 데이터를 손대지 않고 관리 기능 제공
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models import User
from app.dependencies import get_current_admin_user
from app.services.shop_service import ShopService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/shop", 
    tags=["admin-shop"],
    dependencies=[Depends(get_current_admin_user)]
)

@router.get("/products")
async def get_shop_products(
    skip: int = Query(0, ge=0, description="건너뛸 상품 수"),
    limit: int = Query(50, ge=1, le=100, description="조회할 상품 수"),
    search: Optional[str] = Query(None, description="상품명 검색"),
    is_active: Optional[bool] = Query(None, description="활성 상태 필터"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    상점 상품 목록 조회 (관리자 전용)
    """
    logger.info(f"Admin {current_admin.id} requesting shop products list")
    
    try:
        shop_service = ShopService(db)
        products, total = await shop_service.get_products_list(
            skip=skip,
            limit=limit,
            search=search,
            is_active=is_active
        )
        
        return {
            "products": products,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to get shop products: {e}")
        raise HTTPException(status_code=500, detail="상품 목록 조회 중 오류가 발생했습니다.")

@router.get("/products/{product_id}")
async def get_shop_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    특정 상품 상세 조회 (관리자 전용)
    """
    logger.info(f"Admin {current_admin.id} requesting product {product_id}")
    
    try:
        shop_service = ShopService(db)
        product = await shop_service.get_product_by_id(product_id)
        
        if not product:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
        
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="상품 조회 중 오류가 발생했습니다.")

@router.post("/products")
async def create_shop_product(
    product_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    새 상품 생성 (관리자 전용)
    """
    logger.info(f"Admin {current_admin.id} creating new product: {product_data.get('name', 'Unknown')}")
    
    try:
        shop_service = ShopService(db)
        # SQLAlchemy 모델의 id 속성에서 실제 값 추출
        admin_id = getattr(current_admin, 'id')
        product = await shop_service.create_product(product_data, admin_id=admin_id)
        
        return product
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create product: {e}")
        raise HTTPException(status_code=500, detail="상품 생성 중 오류가 발생했습니다.")

@router.put("/products/{product_id}")
async def update_shop_product(
    product_id: int,
    product_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    기존 상품 수정 (관리자 전용)
    """
    logger.info(f"Admin {current_admin.id} updating product {product_id}")
    
    try:
        shop_service = ShopService(db)
        admin_id = getattr(current_admin, 'id')
        product = await shop_service.update_product(product_id, product_data, admin_id=admin_id)
        
        if not product:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
        
        return product
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="상품 수정 중 오류가 발생했습니다.")

@router.delete("/products/{product_id}")
async def delete_shop_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    상품 삭제 (소프트 삭제)
    """
    logger.info(f"Admin {current_admin.id} deleting product {product_id}")
    
    try:
        shop_service = ShopService(db)
        admin_id = getattr(current_admin, 'id')
        success = await shop_service.delete_product(product_id, admin_id=admin_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
        
        return {"message": "상품이 성공적으로 삭제되었습니다.", "product_id": product_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="상품 삭제 중 오류가 발생했습니다.")

@router.post("/products/{product_id}/activate")
async def activate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    상품 활성화
    """
    logger.info(f"Admin {current_admin.id} activating product {product_id}")
    
    try:
        shop_service = ShopService(db)
        admin_id = getattr(current_admin, 'id')
        success = await shop_service.set_product_active(product_id, True, admin_id=admin_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
        
        return {"message": "상품이 활성화되었습니다.", "product_id": product_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to activate product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="상품 활성화 중 오류가 발생했습니다.")

@router.post("/products/{product_id}/deactivate")
async def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    상품 비활성화
    """
    logger.info(f"Admin {current_admin.id} deactivating product {product_id}")
    
    try:
        shop_service = ShopService(db)
        admin_id = getattr(current_admin, 'id')
        success = await shop_service.set_product_active(product_id, False, admin_id=admin_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")
        
        return {"message": "상품이 비활성화되었습니다.", "product_id": product_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deactivate product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="상품 비활성화 중 오류가 발생했습니다.")

@router.get("/categories")
async def get_product_categories(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    상품 카테고리 목록 조회
    """
    try:
        shop_service = ShopService(db)
        categories = await shop_service.get_categories()
        
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="카테고리 조회 중 오류가 발생했습니다.")

@router.get("/stats")
async def get_shop_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    상점 통계 조회
    """
    try:
        shop_service = ShopService(db)
        stats = await shop_service.get_shop_stats()
        
        return stats
    except Exception as e:
        logger.error(f"Failed to get shop stats: {e}")
        raise HTTPException(status_code=500, detail="상점 통계 조회 중 오류가 발생했습니다.")

@router.get("/existing-products")
async def get_existing_products_info(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    기존 상품 정보 조회 (보존 확인용)
    """
    try:
        shop_service = ShopService(db)
        products = await shop_service.get_existing_products_info()
        
        return {"products": products, "message": "기존 상품들이 안전하게 보존되었습니다."}
    except Exception as e:
        logger.error(f"Failed to get existing products info: {e}")
        raise HTTPException(status_code=500, detail="기존 상품 정보 조회 중 오류가 발생했습니다.")
