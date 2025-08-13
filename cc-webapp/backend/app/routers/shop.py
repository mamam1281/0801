from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
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
from ..services.limited_package_service import LimitedPackageService
from ..schemas.limited_package import LimitedPackageOut, LimitedBuyRequest, LimitedBuyReceipt
from ..kafka_client import send_kafka_message

def get_shop_service(db = Depends(get_db)) -> ShopService:
    """Dependency provider for ShopService."""
    return ShopService(db)


class CatalogItem(BaseModel):
    id: int
    sku: str
    name: str
    price_cents: int
    discounted_price_cents: int
    gems: int
    discount_percent: int = 0
    discount_ends_at: Optional[datetime] = None
    min_rank: Optional[str] = None


@router.get("/catalog", response_model=list[CatalogItem], summary="List shop catalog")
def list_catalog():
    items = []
    for p in CatalogService.list_products():
        items.append(CatalogItem(
            id=p.id,
            sku=p.sku,
            name=p.name,
            price_cents=p.price_cents,
            discounted_price_cents=CatalogService.compute_price_cents(p, 1),
            gems=p.gems,
            discount_percent=p.discount_percent or 0,
            discount_ends_at=p.discount_ends_at,
            min_rank=p.min_rank,
        ))
    return items


@router.get("/limited/catalog", response_model=list[LimitedPackageOut], summary="List active limited packages")
def list_limited_catalog(db = Depends(get_db)):
    packages = []
    for p in LimitedPackageService.list_active():
        user_id = None
        user_purchased = 0
        try:
            # best-effort: if an auth middleware added user_id to request state, use it
            user_id = getattr(db, "current_user_id", None)  # placeholder; not critical
        except Exception:
            user_id = None
        if user_id is not None:
            user_purchased = LimitedPackageService.get_user_purchased(p.code, user_id)
        remaining_stock = LimitedPackageService.get_stock(p.code)
        user_remaining = None
        if p.per_user_limit:
            user_remaining = max(p.per_user_limit - user_purchased, 0)
        packages.append(LimitedPackageOut(
            code=p.code,
            name=p.name,
            description=p.description,
            price_cents=p.price_cents,
            gems=p.gems,
            start_at=p.start_at,
            end_at=p.end_at,
            is_active=p.is_active,
            per_user_limit=p.per_user_limit,
            remaining_stock=remaining_stock,
            user_purchased=user_purchased,
            user_remaining=user_remaining,
        ))
    return packages

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
    db.add(models.UserAction(
        user_id=req.user_id,
        action_type="SHOP_BUY",
        action_data=f"{{'sku':'{product.sku}','price_cents':{total_price_cents},'quantity':{req.quantity},'charge_id':'{cap.charge_id}'}}",
    ))
    db.commit()

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


@router.post("/limited/buy", response_model=LimitedBuyReceipt, summary="Buy limited-time package (real money)")
def buy_limited(req: LimitedBuyRequest, db = Depends(get_db)):
    pkg = LimitedPackageService.get(req.code)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    now = datetime.utcnow()
    # normalize to naive for comparison if needed
    if hasattr(pkg.start_at, 'tzinfo') and pkg.start_at.tzinfo is not None:
        now = datetime.now(pkg.start_at.tzinfo)
    if not (pkg.is_active and pkg.start_at <= now <= pkg.end_at):
        raise HTTPException(status_code=403, detail="Package not available")

    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # per-user limit
    already = LimitedPackageService.get_user_purchased(pkg.code, req.user_id)
    if pkg.per_user_limit and already + req.quantity > pkg.per_user_limit:
        raise HTTPException(status_code=403, detail="Per-user limit exceeded")

    # stock reservation
    if not LimitedPackageService.try_reserve(pkg.code, req.quantity):
        raise HTTPException(status_code=409, detail="Out of stock")

    # Promo code handling via service table (per-unit cents off)
    unit_price = pkg.price_cents
    if req.promo_code:
        off = LimitedPackageService.get_promo_discount(pkg.code, req.promo_code)
        unit_price = max(pkg.price_cents - int(off), 0)
    total_price_cents = unit_price * req.quantity
    gateway = PaymentGateway()
    auth = gateway.authorize(total_price_cents, req.currency, card_token=req.card_token)
    if not auth.success:
        LimitedPackageService.release_reservation(pkg.code, req.quantity)
        return LimitedBuyReceipt(
            success=False,
            message=f"Payment failed: {auth.message}",
            user_id=req.user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=None,
        )
    cap = gateway.capture(auth.charge_id or "")
    if not cap.success:
        LimitedPackageService.release_reservation(pkg.code, req.quantity)
        return LimitedBuyReceipt(
            success=False,
            message=f"Capture failed: {cap.message}",
            user_id=req.user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=auth.charge_id,
        )

    token_service = TokenService(db)
    total_gems = pkg.gems * req.quantity
    new_balance = token_service.add_tokens(req.user_id, total_gems)

    # Reward ledger row + link
    reward = models.Reward(
        name=f"BUY_PACKAGE:{pkg.code}",
        description=f"Purchase {req.quantity}x {pkg.name}",
        reward_type="TOKEN",
        value=float(total_gems),
    )
    db.add(reward)
    db.flush()
    db.add(models.UserReward(user_id=req.user_id, reward_id=reward.id))

    # Action log
    db.add(models.UserAction(
        user_id=req.user_id,
        action_type="BUY_PACKAGE",
        action_data=f"{{'code':'{pkg.code}','price_cents':{total_price_cents},'quantity':{req.quantity},'charge_id':'{cap.charge_id}'}}",
    ))

    # finalize user limit counters
    LimitedPackageService.finalize_user_purchase(pkg.code, req.user_id, req.quantity)

    db.commit()

    # Emit Kafka event for analytics (best-effort)
    try:
        from datetime import datetime
        send_kafka_message("buy_package", {
            "type": "BUY_PACKAGE",
            "user_id": req.user_id,
            "code": pkg.code,
            "quantity": req.quantity,
            "total_price_cents": total_price_cents,
            "gems_granted": total_gems,
            "charge_id": cap.charge_id,
            "server_ts": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    return LimitedBuyReceipt(
        success=True,
        message="Purchase completed",
        user_id=req.user_id,
        code=pkg.code,
        quantity=req.quantity,
        total_price_cents=total_price_cents,
        gems_granted=total_gems,
        new_gem_balance=new_balance,
        charge_id=cap.charge_id,
    )
