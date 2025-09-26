from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base
from .base import SoftDeleteMixin


class ShopProduct(Base, SoftDeleteMixin):
    __tablename__ = "shop_products"

    id = Column(Integer, primary_key=True)
    product_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(String(1000))
    price = Column(Integer, nullable=False)  # base price in coins
    is_active = Column(Boolean, default=True)
    
    # 교환권 시스템 관련 필드 - 임시 주석 처리 (DB 스키마 불일치)
    # voucher_type = Column(String(50), default='external')  # external, internal, bonus
    # external_service = Column(String(100))  # 외부 서비스 명 (예: "daily_comp", "charge_boost")
    # stock_total = Column(Integer, nullable=True)  # 총 재고 (unlimited면 null)
    # stock_remaining = Column(Integer, nullable=True)  # 남은 재고
    # per_user_limit = Column(Integer, nullable=True)  # 사용자당 구매 제한
    
    # Avoid SQLAlchemy reserved attribute name 'metadata' on declarative models
    extra = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class VoucherUsage(Base):
    """교환권 사용 내역 추적"""
    __tablename__ = "voucher_usage"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    voucher_id = Column(String(100), nullable=False)  # shop_products.product_id 참조
    voucher_name = Column(String(200), nullable=False)  # 사용 시점의 교환권 이름
    external_service = Column(String(100), nullable=True)  # 외부 서비스 명
    
    # 사용 상태
    status = Column(String(20), nullable=False, default="purchased")  
    # purchased: 구매됨, used: 사용됨, expired: 만료됨, refunded: 환불됨
    
    # 사용 정보
    purchased_at = Column(DateTime, default=datetime.utcnow)
    used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # 거래 정보
    transaction_id = Column(Integer, ForeignKey("shop_transactions.id"), nullable=True)
    purchase_price = Column(Integer, nullable=False)
    
    # 외부 서비스 연동 정보
    external_request_id = Column(String(100), nullable=True)  # 외부 API 요청 ID
    external_response = Column(JSON, nullable=True)  # 외부 API 응답
    
    # 메타 정보
    extra = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # 인덱스
    __table_args__ = (
        # 사용자별 교환권별 빠른 조회
        UniqueConstraint('user_id', 'voucher_id', 'transaction_id', name='uq_voucher_usage_user_voucher_tx'),
    )


class ShopDiscount(Base):
    __tablename__ = "shop_discounts"

    id = Column(Integer, primary_key=True)
    product_id = Column(String(100), index=True, nullable=False)  # references ShopProduct.product_id
    discount_type = Column(String(20), nullable=False)  # percent | flat
    value = Column(Integer, nullable=False)  # percent (0-100) or flat amount
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ShopTransaction(Base):
    __tablename__ = "shop_transactions"
    __table_args__ = (
        # 하나의 사용자-상품-멱등키 조합은 단일 트랜잭션으로 고정
        UniqueConstraint('user_id', 'product_id', 'idempotency_key', name='uq_shop_tx_user_product_idem'),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(String(100), index=True, nullable=False)
    kind = Column(String(20), nullable=False)  # gems | item
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Integer, nullable=False)
    amount = Column(Integer, nullable=False)
    payment_method = Column(String(50))
    status = Column(String(20), nullable=False, default="success")  # pending|success|failed|refunded
    receipt_code = Column(String(64), unique=True, index=True)
    failure_reason = Column(String(500))
    # 무결성 검증용 해시 (user_id|product_id|amount|quantity|charge_id|receipt_code 등 조합 sha256)
    integrity_hash = Column(String(64), nullable=True, index=True)
    # 환불/보정 대비 원본 트랜잭션 참조 (self-reference)
    original_tx_id = Column(Integer, ForeignKey("shop_transactions.id"), nullable=True)
    # 클라이언트 제공 검증용 영수증 서명(HMAC) - integrity_hash와 별개 (회전 가능 secret 기반)
    receipt_signature = Column(String(128), nullable=True, index=True)
    # 멱등성 키 (클라이언트/서버 생성). 동일 키 재요청 시 최초 성공 트랜잭션 재사용.
    idempotency_key = Column(String(80), nullable=True, index=True)
    # Avoid SQLAlchemy reserved attribute name 'metadata' on declarative models
    extra = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    # NOTE: status 값 확장 예정(success|failed|voided|reversed 등) - DB 레벨 제약 없음(문서 참조)


class ShopLimitedPackage(Base):
    __tablename__ = "shop_limited_packages"

    id = Column(Integer, primary_key=True)
    package_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(String(1000))
    price = Column(Integer, nullable=False)  # price in tokens
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    stock_total = Column(Integer, nullable=True)
    stock_remaining = Column(Integer, nullable=True)
    per_user_limit = Column(Integer, nullable=True)  # e.g., 1 means once per user
    emergency_disabled = Column(Boolean, default=False)
    contents = Column(JSON)  # e.g., {"bonus_tokens": 100, "items": [{"id":"x","qty":1}]}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ShopPromoCode(Base):
    __tablename__ = "shop_promo_codes"

    id = Column(Integer, primary_key=True)
    code = Column(String(64), unique=True, index=True, nullable=False)
    package_id = Column(String(100), index=True, nullable=True)  # null means global
    discount_type = Column(String(20), nullable=False, default='flat')  # percent|flat
    value = Column(Integer, nullable=False, default=0)
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    max_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ShopPromoUsage(Base):
    __tablename__ = "shop_promo_usage"

    id = Column(Integer, primary_key=True)
    promo_code = Column(String(64), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    package_code = Column(String(100), index=True, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    used_at = Column(DateTime, default=datetime.utcnow)
    # Avoid SQLAlchemy reserved attribute name 'metadata'
    details = Column(JSON)


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., CREATE_PROMO, DISABLE_PACKAGE
    target_type = Column(String(100), nullable=True)  # e.g., promo, package, user
    target_id = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Avoid SQLAlchemy reserved attribute name 'metadata'
    details = Column(JSON)
