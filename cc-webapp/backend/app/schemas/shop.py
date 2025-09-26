"""
Shop Schemas for Admin Management
기존 shop_products 테이블 구조에 맞춘 Pydantic 스키마
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class ShopProductBase(BaseModel):
    """상품 기본 스키마"""
    product_id: str = Field(..., description="상품 고유 ID")
    name: str = Field(..., min_length=1, max_length=255, description="상품명")
    description: Optional[str] = Field(None, description="상품 설명")
    price: int = Field(..., ge=0, description="상품 가격 (정수)")
    is_active: bool = Field(True, description="활성 상태")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="메타데이터")
    extra: Optional[Dict[str, Any]] = Field(default_factory=dict, description="추가 정보")

class ShopProductCreate(ShopProductBase):
    """상품 생성 스키마"""
    
    @validator('product_id')
    def validate_product_id(cls, v):
        if not v or not v.strip():
            raise ValueError('상품 ID는 필수입니다.')
        return v.strip()
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('상품명은 필수입니다.')
        return v.strip()

class ShopProductUpdate(BaseModel):
    """상품 수정 스키마 - 모든 필드 선택적"""
    product_id: Optional[str] = Field(None, description="상품 고유 ID")
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="상품명")
    description: Optional[str] = Field(None, description="상품 설명")
    price: Optional[int] = Field(None, ge=0, description="상품 가격 (정수)")
    is_active: Optional[bool] = Field(None, description="활성 상태")
    metadata: Optional[Dict[str, Any]] = Field(None, description="메타데이터")
    extra: Optional[Dict[str, Any]] = Field(None, description="추가 정보")
    
    @validator('product_id')
    def validate_product_id(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('상품 ID는 빈 값일 수 없습니다.')
        return v.strip() if v else v
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('상품명은 빈 값일 수 없습니다.')
        return v.strip() if v else v

class ShopProductResponse(ShopProductBase):
    """상품 응답 스키마"""
    id: int = Field(..., description="내부 ID")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")
    deleted_at: Optional[datetime] = Field(None, description="삭제 시간")
    
    class Config:
        from_attributes = True

class ShopProductListResponse(BaseModel):
    """상품 목록 응답 스키마"""
    products: List[ShopProductResponse] = Field(..., description="상품 목록")
    total: int = Field(..., description="전체 상품 수")
    skip: int = Field(..., description="건너뛴 수")
    limit: int = Field(..., description="조회 제한 수")

class ShopStatsResponse(BaseModel):
    """상점 통계 응답 스키마"""
    total_products: int = Field(..., description="전체 상품 수")
    active_products: int = Field(..., description="활성 상품 수")
    inactive_products: int = Field(..., description="비활성 상품 수")
    deleted_products: int = Field(..., description="삭제된 상품 수")
    total_sales: int = Field(..., description="총 판매 수")
    total_revenue: int = Field(..., description="총 매출")
    categories: List[str] = Field(..., description="카테고리 목록")
    
class ShopCategoryResponse(BaseModel):
    """카테고리 응답 스키마"""
    name: str = Field(..., description="카테고리명")
    count: int = Field(..., description="해당 카테고리 상품 수")

# 기존 상품 보존을 위한 스키마
class ExistingProductInfo(BaseModel):
    """기존 상품 정보 (읽기 전용)"""
    id: int
    product_id: str
    name: str
    price: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# 가챠 아이템 관련 스키마
class GachaItemBase(BaseModel):
    """가챠 아이템 기본 스키마"""
    name: str = Field(..., min_length=1, max_length=255, description="아이템명")
    description: Optional[str] = Field(None, description="아이템 설명")
    rarity: str = Field(..., description="희귀도")
    probability: float = Field(..., ge=0.0, le=1.0, description="확률")
    is_active: bool = Field(True, description="활성 상태")

class GachaItemCreate(GachaItemBase):
    """가챠 아이템 생성 스키마"""
    pass

class GachaItemUpdate(BaseModel):
    """가챠 아이템 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="아이템명")
    description: Optional[str] = Field(None, description="아이템 설명")
    rarity: Optional[str] = Field(None, description="희귀도")
    probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="확률")
    is_active: Optional[bool] = Field(None, description="활성 상태")

class GachaItemResponse(GachaItemBase):
    """가챠 아이템 응답 스키마"""
    id: int = Field(..., description="내부 ID")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")
    
    class Config:
        from_attributes = True
