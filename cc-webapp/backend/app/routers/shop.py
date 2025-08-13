from fastapi import APIRouter, Depends, HTTPException
import json
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from .. import models
from ..database import get_db

router = APIRouter(prefix="/api/shop", tags=["Shop"])

class ShopPurchaseRequest(BaseModel):
    user_id: int
    item_id: int
    item_name: str
    price: int
    description: Optional[str] = None

class ShopPurchaseResponse(BaseModel):
    success: bool
    message: str
    new_gold_balance: int
    item_id: int
    item_name: str
    new_item_count: int


class BuyRequest(BaseModel):
    user_id: int
    product_id: int = Field(..., description="Catalog product id")
    quantity: int = Field(1, ge=1, le=99)
    currency: str = Field("USD")
    card_token: Optional[str] = None


class BuyReceipt(BaseModel):
    success: bool
    message: str
    user_id: int
    product_id: int
    sku: str
    quantity: int
    total_price_cents: int
    gems_granted: int
    new_gem_balance: int
    charge_id: Optional[str] = None

from ..services.shop_service import ShopService
from ..services.catalog_service import CatalogService
from ..services.payment_gateway import PaymentGateway
from ..services.token_service import TokenService
from ..core.config import settings
from ..kafka_client import send_kafka_message

def get_shop_service(db = Depends(get_db)) -> ShopService:
    """Dependency provider for ShopService."""
    return ShopService(db)


class CatalogItem(BaseModel):
    id: int
    sku: str
    name: str
    price_cents: int
    gems: int
    discount_percent: int = 0
    discount_ends_at: Optional[str] = None
    min_rank: Optional[str] = None
    effective_price_cents: int


@router.get("/catalog", response_model=List[CatalogItem], summary="List shop catalog")
def list_catalog():
    items = []
    now = datetime.utcnow()
    for p in CatalogService.list_products():
        effective = CatalogService.compute_price_cents(p, 1)
        items.append(CatalogItem(
            id=p.id,
            sku=p.sku,
            name=p.name,
            price_cents=p.price_cents,
            gems=p.gems,
            discount_percent=p.discount_percent or 0,
            discount_ends_at=p.discount_ends_at.isoformat() if p.discount_ends_at else None,
            min_rank=p.min_rank,
            effective_price_cents=effective,
        ))
    return items

@router.post("/purchase", response_model=ShopPurchaseResponse, summary="Purchase Item", description="Purchase shop item using user's gold tokens")
def purchase_shop_item(
    request: ShopPurchaseRequest,
    shop_service: ShopService = Depends(get_shop_service)
):
    """
    ### Request Body:
    - **user_id**: ID of the user purchasing the item
    - **item_id**: ID of the item to purchase
    - **item_name**: Name of the item to purchase
    - **price**: Price of the item
    - **description**: Item description (optional)

    ### Response:
    - **success**: Purchase success status
    - **message**: Processing result message
    - **new_gold_balance**: User's gold token balance after purchase
    - **item_id, item_name, new_item_count**: Purchased item info and new count
    """
    try:
        result = shop_service.purchase_item(
            user_id=request.user_id,
            item_id=request.item_id,
            item_name=request.item_name,
            price=request.price,
            description=request.description
        )
        if not result["success"]:
            # Handle the case of insufficient funds gracefully
            return ShopPurchaseResponse(
                success=False,
                message=result["message"],
                new_gold_balance=result["new_balance"],
                item_id=request.item_id,
                item_name=request.item_name,
                new_item_count=0
            )

        return ShopPurchaseResponse(
            success=True,
            message=result["message"],
            new_gold_balance=result["new_balance"],
            item_id=result["item_id"],
            item_name=result["item_name"],
            new_item_count=result["new_item_count"]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/buy", response_model=BuyReceipt, summary="Buy premium gems (real money)")
def buy_gems(
    req: BuyRequest,
    db = Depends(get_db),
):
    # 1) Resolve product
    product = CatalogService.get_product(req.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2) Eligibility check (rank)
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    required_rank = product.min_rank
    if required_rank and (getattr(user, "user_rank", "STANDARD") != required_rank):
        raise HTTPException(status_code=403, detail=f"Requires rank {required_rank}")

    # 3) Compute price and attempt payment
    total_price_cents = CatalogService.compute_price_cents(product, req.quantity)
    gateway = PaymentGateway()
    auth = gateway.authorize(total_price_cents, req.currency, card_token=req.card_token)
    if not auth.success:
        return BuyReceipt(
            success=False,
            message=f"Payment failed: {auth.message}",
            user_id=req.user_id,
            product_id=req.product_id,
            sku=product.sku,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=None,
        )
    cap = gateway.capture(auth.charge_id or "")
    if not cap.success:
        return BuyReceipt(
            success=False,
            message=f"Capture failed: {cap.message}",
            user_id=req.user_id,
            product_id=req.product_id,
            sku=product.sku,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=auth.charge_id,
        )

    # 4) Grant gems and write logs/receipt
    token_service = TokenService(db)
    total_gems = product.gems * req.quantity
    new_balance = token_service.add_tokens(req.user_id, total_gems)

    # Reward ledger row (as financial receipt substitute): create Reward + link
    reward = models.Reward(
        name=f"BUY_GEMS:{product.sku}",
        description=f"Purchase {req.quantity}x {product.name}",
        reward_type="TOKEN",
        value=float(total_gems),
    )
    db.add(reward)
    db.flush()
    db.add(models.UserReward(user_id=req.user_id, reward_id=reward.id))

    # Transaction log
    action_payload = {
        "sku": product.sku,
        "price_cents": total_price_cents,
        "quantity": req.quantity,
        "charge_id": cap.charge_id,
    }
    db.add(models.UserAction(
        user_id=req.user_id,
        action_type="SHOP_BUY",
        action_data=json.dumps(action_payload),
    ))
    db.commit()

    # Optional Kafka publish for analytics pipeline
    try:
        if settings.KAFKA_ENABLED:
            send_kafka_message(settings.KAFKA_ACTIONS_TOPIC, {
                "type": "SHOP_BUY",
                "user_id": req.user_id,
                "sku": product.sku,
                "price_cents": total_price_cents,
                "quantity": req.quantity,
                "charge_id": cap.charge_id,
                "gems_granted": total_gems,
                "ts": datetime.utcnow().isoformat(),
            })
    except Exception as _e:
        # Non-fatal in local/dev; logged by kafka_client
        pass

    return BuyReceipt(
        success=True,
        message="Purchase completed",
        user_id=req.user_id,
        product_id=req.product_id,
        sku=product.sku,
        quantity=req.quantity,
        total_price_cents=total_price_cents,
        gems_granted=total_gems,
        new_gem_balance=new_balance,
        charge_id=cap.charge_id,
    )
