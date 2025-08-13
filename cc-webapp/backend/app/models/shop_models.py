from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from .auth_models import Base


class ShopProduct(Base):
    __tablename__ = "shop_products"

    id = Column(Integer, primary_key=True)
    product_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(String(1000))
    price = Column(Integer, nullable=False)  # base price in coins
    is_active = Column(Boolean, default=True)
    # Avoid SQLAlchemy reserved attribute name 'metadata' on declarative models
    extra = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


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
    # Avoid SQLAlchemy reserved attribute name 'metadata' on declarative models
    extra = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
