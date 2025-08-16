from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
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
    product_id: str = Field(..., description="Catalog product id or item code")
    amount: int = Field(..., ge=0, description="Amount in cents or tokens depending on kind")
    quantity: int = Field(1, ge=1, le=99)
    kind: Literal["gems", "item"] = Field("gems")
    payment_method: Optional[str] = Field(None, description="card|tokens etc")
    item_name: Optional[str] = None
    currency: str = Field("USD")
    card_token: Optional[str] = None
    idempotency_key: Optional[str] = Field(None, description="Client-provided idempotency key (unique per purchase attempt)")


class BuyReceipt(BaseModel):
    success: bool
    message: str
    # Common
    user_id: int
    product_id: str
    quantity: int
    # Gems purchase fields
    granted_gems: Optional[int] = None
    new_balance: Optional[int] = None
    receipt_code: Optional[str] = None
    # Item purchase fields
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    # Standardized reason codes for failure UI handling
    reason_code: Optional[str] = None

from ..services.shop_service import ShopService
from ..services.catalog_service import CatalogService
from ..services.payment_gateway import PaymentGatewayService, PaymentGateway
from ..services.token_service import TokenService
from ..dependencies import get_current_user
from ..services.limited_package_service import LimitedPackageService
from ..schemas.limited_package import LimitedPackageOut, LimitedBuyRequest, LimitedBuyReceipt
from ..kafka_client import send_kafka_message
from ..utils.redis import get_redis_manager
from ..core.config import settings
from ..utils.utils import WebhookUtils
from fastapi import Request

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


@router.get("/limited-packages", response_model=List[LimitedPackageOut], summary="List active limited packages")
def list_limited_packages(db = Depends(get_db)):
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

# --- Compatibility endpoints for legacy tests/clients ---
class LimitedBuyCompatRequest(BaseModel):
    user_id: int
    code: str = Field(..., description="Limited package code")
    quantity: int = Field(1, ge=1, le=10)
    currency: str = Field("USD")
    card_token: Optional[str] = None
    promo_code: Optional[str] = None
    idempotency_key: Optional[str] = Field(None, description="Client-provided idempotency key")


@router.get("/limited/catalog", response_model=List[LimitedPackageOut], summary="[Compat] List limited packages")
def list_limited_catalog_compat():
    packages: List[LimitedPackageOut] = []
    for p in LimitedPackageService.list_active():
        remaining_stock = LimitedPackageService.get_stock(p.code)
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
            user_purchased=0,
            user_remaining=None,
        ))
    return packages


@router.post(
    "/limited/buy",
    response_model=LimitedBuyReceipt,
    summary="[Compat] Buy limited-time package (no auth)",
    operation_id="compat_buy_limited_package",
)
def buy_limited_compat(req: LimitedBuyCompatRequest, db = Depends(get_db)):
    user_id = int(req.user_id)
    rman = get_redis_manager()
    idem = (req.idempotency_key or '').strip() or None
    IDEM_TTL = settings.IDEMPOTENCY_TTL_SECONDS

    def _idem_key(uid: int, code: str, key: str) -> str:
        return f"shop:limited:idemp:{uid}:{code}:{key}"

    pkg = LimitedPackageService.get(req.code)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    # Time window and active check
    now = datetime.utcnow()
    if hasattr(pkg.start_at, 'tzinfo') and pkg.start_at.tzinfo is not None:
        now = datetime.now(pkg.start_at.tzinfo)
    if not (pkg.is_active and pkg.start_at <= now <= pkg.end_at):
        # Legacy behavior expects 403
        raise HTTPException(status_code=403, detail="Package not available")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fast path idempotency
    if idem and rman.redis_client:
        try:
            if rman.redis_client.exists(_idem_key(user_id, pkg.code, idem)):
                return LimitedBuyReceipt(success=True, message="중복 요청 처리됨", user_id=user_id, code=pkg.code)
        except Exception:
            pass

    # Per-user limit check → 403
    already = LimitedPackageService.get_user_purchased(pkg.code, user_id)
    if pkg.per_user_limit and already + req.quantity > pkg.per_user_limit:
        raise HTTPException(status_code=403, detail="Per-user limit exceeded")

    # Sweep expired holds and try reserve
    try:
        LimitedPackageService.sweep_expired_holds(pkg.code)
    except Exception:
        pass
    hold_id: Optional[str] = None
    if not LimitedPackageService.try_reserve(pkg.code, req.quantity):
        # Out of stock → 409
        raise HTTPException(status_code=409, detail="Out of stock")
    try:
        hold_id = LimitedPackageService.add_hold(pkg.code, req.quantity, ttl_seconds=settings.LIMITED_HOLD_TTL_SECONDS)
    except Exception:
        hold_id = None

    # Pricing with promo
    unit_price = pkg.price_cents
    if req.promo_code:
        if not LimitedPackageService.can_use_promo(req.promo_code):
            try:
                if hold_id:
                    LimitedPackageService.remove_hold(pkg.code, hold_id)
            finally:
                LimitedPackageService.release_reservation(pkg.code, req.quantity)
            # Treat as conflict
            raise HTTPException(status_code=409, detail="Promo code usage limit reached")
        off = LimitedPackageService.get_promo_discount(pkg.code, req.promo_code)
        unit_price = max(pkg.price_cents - int(off), 0)
    total_price_cents = unit_price * req.quantity

    # Payment
    gateway = PaymentGateway()
    from ..services.payment_gateway import authorize_with_retry, capture_with_retry
    auth = authorize_with_retry(gateway, total_price_cents, req.currency, card_token=req.card_token)
    if not auth.success:
        try:
            if hold_id:
                LimitedPackageService.remove_hold(pkg.code, hold_id)
        finally:
            LimitedPackageService.release_reservation(pkg.code, req.quantity)
        return LimitedBuyReceipt(
            success=False,
            message=f"Payment failed: {auth.message}",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=None,
            reason_code="PAYMENT_FAILED",
        )
    cap = capture_with_retry(gateway, auth.charge_id or "")
    if not cap.success:
        try:
            if hold_id:
                LimitedPackageService.remove_hold(pkg.code, hold_id)
        finally:
            LimitedPackageService.release_reservation(pkg.code, req.quantity)
        return LimitedBuyReceipt(
            success=False,
            message=f"Capture failed: {cap.message}",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=auth.charge_id,
            reason_code="PAYMENT_FAILED",
        )

    # Grant gems
    token_service = TokenService(db)
    total_gems = pkg.gems * req.quantity
    new_balance = token_service.add_tokens(user_id, total_gems)

    # Reward + action log
    reward = models.Reward(
        name=f"BUY_PACKAGE:{pkg.code}",
        description=f"Purchase {req.quantity}x {pkg.name}",
        reward_type="TOKEN",
        value=float(total_gems),
    )
    db.add(reward)
    db.flush()
    db.add(models.UserReward(user_id=user_id, reward_id=reward.id))
    db.add(models.UserAction(
        user_id=user_id,
        action_type="BUY_PACKAGE",
        action_data=f"{{'code':'{pkg.code}','price_cents':{total_price_cents},'quantity':{req.quantity},'charge_id':'{cap.charge_id}'}}",
    ))

    # finalize counters
    LimitedPackageService.finalize_user_purchase(pkg.code, user_id, req.quantity)
    if req.promo_code:
        LimitedPackageService.record_promo_use(req.promo_code)
    db.commit()

    # Kafka event (best-effort)
    try:
        send_kafka_message("buy_package", {
            "type": "BUY_PACKAGE",
            "user_id": user_id,
            "code": pkg.code,
            "quantity": req.quantity,
            "total_price_cents": total_price_cents,
            "gems_granted": total_gems,
            "charge_id": cap.charge_id,
            "server_ts": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    # synthetic receipt + cleanup hold
    import uuid
    receipt_code = uuid.uuid4().hex[:12]
    try:
        if hold_id:
            LimitedPackageService.remove_hold(pkg.code, hold_id)
    except Exception:
        pass
    # Record promo usage into DB (best-effort) for analytics/compliance
    try:
        if req.promo_code:
            db.add(models.ShopPromoUsage(
                promo_code=req.promo_code,
                user_id=user_id,
                package_code=pkg.code,
                quantity=req.quantity,
                details={"unit_price": unit_price, "total": total_price_cents, "receipt_code": receipt_code},
            ))
            pc = db.query(models.ShopPromoCode).filter(models.ShopPromoCode.code == req.promo_code).first()
            if pc is not None:
                pc.used_count = int(pc.used_count or 0) + req.quantity
            db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
    # idempotency mark after success
    if idem and rman.redis_client:
        try:
            rman.redis_client.setex(_idem_key(user_id, pkg.code, idem), IDEM_TTL, receipt_code)
        except Exception:
            pass
    return LimitedBuyReceipt(
        success=True,
        message="Purchase completed",
        user_id=user_id,
        code=pkg.code,
        quantity=req.quantity,
        total_price_cents=total_price_cents,
        gems_granted=total_gems,
        new_gem_balance=new_balance,
        charge_id=cap.charge_id,
        receipt_code=receipt_code,
    )
 
# Legacy/test-only schema to support body user_id/code for limited purchase
class LegacyLimitedBuyRequest(BaseModel):
    user_id: int
    code: str
    quantity: int = Field(1, ge=1, le=10)
    currency: str = Field("USD")
    card_token: Optional[str] = None
    promo_code: Optional[str] = None
    idempotency_key: Optional[str] = Field(None, description="Client-provided idempotency key (unique per purchase attempt)")

@router.post("/webhook/payment", summary="Payment Webhook")
async def payment_webhook(request: Request):
    """Verify HMAC signature and accept payment provider webhook.
    Expected header: X-Signature: sha256=<hex>
    Secret: settings.PAYMENT_WEBHOOK_SECRET
    """
    raw_body = await request.body()
    provided = request.headers.get("X-Signature", "")
    try:
        # Compute signature over raw payload
        expected = WebhookUtils.generate_webhook_signature(raw_body.decode("utf-8"), settings.PAYMENT_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")
    import hmac
    if not (provided and hmac.compare_digest(provided, expected)):
        raise HTTPException(status_code=401, detail="Invalid signature")
    # For now, just ack; in future, map to receipt and settle
    return {"ok": True}

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


@router.post("/buy", response_model=BuyReceipt, summary="Buy gems or items")
def buy(
    req: BuyRequest,
    db = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Always use authenticated user regardless of body user_id to prevent spoofing
    user = current_user
    req_user_id = getattr(user, "id", None)
    if not req_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    shop_svc = ShopService(db)

    # Idempotency protection for item/gems purchases (best-effort via Redis)
    idem = (req.idempotency_key or '').strip() or None
    rman = get_redis_manager()

    IDEM_TTL = settings.IDEMPOTENCY_TTL_SECONDS  # configurable window for retries
    IDEM_PREFIX = "shop:idemp:"

    def _idem_key(uid: int, pid: str, key: str) -> str:
        return f"{IDEM_PREFIX}{uid}:{pid}:{key}"

    # If idempotency key present and lock exists, short-circuit with generic success (client should have prior receipt)
    if idem and rman.redis_client:
        if rman.redis_client.exists(_idem_key(req_user_id, req.product_id, idem)):
            # Return a soft acknowledgement; real state already applied
            return BuyReceipt(
                success=True,
                message="중복 요청 처리됨",
                user_id=req_user_id,
                product_id=req.product_id,
                quantity=req.quantity,
                receipt_code=None,
            )

    if req.kind == "item":
        # Item purchases consume tokens immediately
        result = shop_svc.purchase_item(
            user_id=req_user_id,
            item_id=0,
            item_name=req.item_name or req.product_id,
            price=req.amount,
            description=None,
            product_id=req.product_id,
        )
        if not result["success"]:
            return BuyReceipt(
                success=False,
                message=result["message"],
                user_id=req_user_id,
                product_id=req.product_id,
                quantity=req.quantity,
                item_id=req.product_id,
                item_name=req.item_name or req.product_id,
                new_balance=result.get("new_balance"),
            )
        resp = BuyReceipt(
            success=True,
            message=result["message"],
            user_id=req_user_id,
            product_id=req.product_id,
            quantity=req.quantity,
            item_id=result.get("item_id"),
            item_name=result.get("item_name"),
            new_balance=result.get("new_balance"),
        )
        # Mark idempotency for item purchases (no external gateway)
        if idem and rman.redis_client:
            try:
                rman.redis_client.setex(_idem_key(req_user_id, req.product_id, idem), IDEM_TTL, "1")
            except Exception:
                pass
        return resp

    # Gems purchase via external gateway (can be pending)
    gateway = PaymentGatewayService()
    # Create pending transaction record
    from datetime import datetime as _dt
    import uuid
    receipt_code = uuid.uuid4().hex[:12]
    shop_svc.record_transaction(
        user_id=req_user_id,
        product_id=req.product_id,
        kind='gems',
        quantity=req.quantity,
        unit_price=int(req.amount),
        amount=int(req.amount),
        payment_method=req.payment_method or 'card',
        status='pending',
        receipt_code=receipt_code,
        extra={"currency": req.currency},
    )
    # Also append a lightweight action log for environments without transactions table
    try:
        db.add(models.UserAction(
            user_id=req_user_id,
            action_type='PURCHASE_GEMS',
            action_data=f'{{"product_id":"{req.product_id}","kind":"gems","quantity":{req.quantity},"amount":{int(req.amount)},"payment_method":"{req.payment_method or "card"}","status":"pending","receipt_code":"{receipt_code}"}}'
        ))
        db.commit()
    except Exception:
        db.rollback()
    pres = gateway.process_payment(amount=int(req.amount), method=req.payment_method, metadata={"product_id": req.product_id})
    status = pres.get("status")
    if status == "failed":
        # Update to failed
        db_tx = shop_svc.get_tx_by_receipt_for_user(req_user_id, receipt_code)
        if db_tx:
            db_tx.status = 'failed'
            try:
                db.commit()
            except Exception:
                db.rollback()
        return BuyReceipt(
            success=False,
            message="결제 거절됨",
            user_id=req_user_id,
            product_id=req.product_id,
            quantity=req.quantity,
            receipt_code=receipt_code,
            new_balance=getattr(user, "cyber_token_balance", 0),
            reason_code="PAYMENT_DECLINED",
        )
    elif status == "pending":
        # Update action log with gateway_reference for later settlement mapping
        try:
            db.add(models.UserAction(
                user_id=req_user_id,
                action_type='PURCHASE_GEMS',
                action_data=f'{{"product_id":"{req.product_id}","kind":"gems","quantity":{req.quantity},"amount":{int(req.amount)},"payment_method":"{req.payment_method or "card"}","status":"pending","receipt_code":"{receipt_code}","gateway_reference":"{pres.get("gateway_reference")}"}}'
            ))
            db.commit()
        except Exception:
            db.rollback()
        return BuyReceipt(
            success=False,
            message="결제 대기 중",
            user_id=req_user_id,
            product_id=req.product_id,
            quantity=req.quantity,
            receipt_code=receipt_code,
            new_balance=getattr(user, "cyber_token_balance", 0),
            reason_code="PAYMENT_PENDING",
        )
    else:
        # success immediately
        total_gems = int(req.amount)
        new_balance = TokenService(db).add_tokens(req_user_id, total_gems)
        # mark success
        db_tx = shop_svc.get_tx_by_receipt_for_user(req_user_id, receipt_code)
        if db_tx:
            db_tx.status = 'success'
            try:
                db.commit()
            except Exception:
                db.rollback()
        resp = BuyReceipt(
            success=True,
            message="구매 완료",
            user_id=req_user_id,
            product_id=req.product_id,
            quantity=req.quantity,
            granted_gems=total_gems,
            new_balance=new_balance,
            receipt_code=receipt_code,
        )
        # Mark idempotency after successful grant
        if idem and rman.redis_client:
            try:
                rman.redis_client.setex(_idem_key(req_user_id, req.product_id, idem), IDEM_TTL, receipt_code)
            except Exception:
                pass
        return resp


@router.get("/transactions")
def list_my_transactions(limit: int = 20, db = Depends(get_db), current_user = Depends(get_current_user)):
    svc = ShopService(db)
    return svc.list_transactions(current_user.id, limit)


@router.post("/transactions/{receipt}/settle")
def settle_my_transaction(receipt: str, db = Depends(get_db), current_user = Depends(get_current_user)):
    svc = ShopService(db)
    res = svc.settle_pending_gems_for_user(current_user.id, receipt)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Failed"))
    return res


# --- Compatibility endpoints for existing tests ---
@router.get("/limited/catalog", response_model=List[LimitedPackageOut], summary="List limited packages (compat)")
def list_limited_catalog(db = Depends(get_db)):
    return list_limited_packages(db)


@router.post(
    "/limited/buy",
    response_model=LimitedBuyReceipt,
    summary="Buy limited-time package (compat)",
    operation_id="compat_buy_limited_package_legacy",
)
def buy_limited_compat(req: LegacyLimitedBuyRequest, db = Depends(get_db)):
    # Map to new endpoint using explicit user context
    # Authenticate as provided user_id for test compatibility
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    mapped = LimitedBuyRequest(
        package_id=req.code,
        quantity=req.quantity,
        currency=req.currency,
        card_token=req.card_token,
        promo_code=req.promo_code,
        idempotency_key=req.idempotency_key,
    )
    # Call core handler by temporarily faking current_user dependency
    res = buy_limited(mapped, db=db, current_user=user)
    # Map certain failures to HTTP status codes expected by legacy tests
    if isinstance(res, LimitedBuyReceipt) and not res.success:
        code_map = {
            "WINDOW_CLOSED": 403,
            "USER_LIMIT": 403,
            "OUT_OF_STOCK": 409,
        }
        status_code = code_map.get(res.reason_code or "")
        if status_code:
            raise HTTPException(status_code=status_code, detail=res.message)
    return res


@router.post(
    "/buy-limited",
    response_model=LimitedBuyReceipt,
    summary="Buy limited-time package (real money)",
    operation_id="buy_limited_package",
)
def buy_limited(req: LimitedBuyRequest, db = Depends(get_db), current_user = Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    # Idempotency guard for limited purchases
    rman = get_redis_manager()
    idem = (getattr(req, 'idempotency_key', None) or '').strip() or None
    IDEM_TTL = 60 * 10
    def _idem_key(uid: int, code: str, key: str) -> str:
        return f"shop:limited:idemp:{uid}:{code}:{key}"
    pkg = LimitedPackageService.get(req.package_id)
    if not pkg:
        return LimitedBuyReceipt(success=False, message="Package not found", user_id=user_id, reason_code="NOT_FOUND")
    now = datetime.utcnow()
    # normalize to naive for comparison if needed
    if hasattr(pkg.start_at, 'tzinfo') and pkg.start_at.tzinfo is not None:
        now = datetime.now(pkg.start_at.tzinfo)
    if not (pkg.is_active and pkg.start_at <= now <= pkg.end_at):
        cur_user = db.query(models.User).filter(models.User.id == user_id).first()
        return LimitedBuyReceipt(success=False, message="Package not available", user_id=user_id, code=pkg.code, reason_code="WINDOW_CLOSED", new_gem_balance=getattr(cur_user, 'cyber_token_balance', 0) if cur_user else None)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return LimitedBuyReceipt(success=False, message="User not found", user_id=user_id, reason_code="UNAUTHORIZED", new_gem_balance=None)

    # Fast path: if idempotency key already seen, acknowledge
    if idem and rman.redis_client:
        if rman.redis_client.exists(_idem_key(user_id, req.package_id, idem)):
            cur_user = db.query(models.User).filter(models.User.id == user_id).first()
            return LimitedBuyReceipt(success=True, message="중복 요청 처리됨", user_id=user_id, code=req.package_id, new_gem_balance=getattr(cur_user, 'cyber_token_balance', 0) if cur_user else None)

    # per-user limit
    already = LimitedPackageService.get_user_purchased(pkg.code, user_id)
    if pkg.per_user_limit and already + req.quantity > pkg.per_user_limit:
        return LimitedBuyReceipt(success=False, message="Per-user limit exceeded", user_id=user_id, code=pkg.code, reason_code="USER_LIMIT", new_gem_balance=getattr(user, 'cyber_token_balance', 0))

    # Sweep expired holds to return any timed-out reservations back to stock (best-effort)
    try:
        LimitedPackageService.sweep_expired_holds(pkg.code)
    except Exception:
        pass

    # stock reservation
    hold_id: Optional[str] = None
    if not LimitedPackageService.try_reserve(pkg.code, req.quantity):
        return LimitedBuyReceipt(success=False, message="Out of stock", user_id=user_id, code=pkg.code, reason_code="OUT_OF_STOCK", new_gem_balance=getattr(user, 'cyber_token_balance', 0))

    # add a short hold so that if payment fails or client drops, stock returns after TTL
    try:
        hold_id = LimitedPackageService.add_hold(pkg.code, req.quantity, ttl_seconds=settings.LIMITED_HOLD_TTL_SECONDS)
    except Exception:
        # non-fatal if hold tracking fails; continue
        hold_id = None

    # Promo code handling via service table (per-unit cents off) + max-uses guard
    unit_price = pkg.price_cents
    if req.promo_code:
        if not LimitedPackageService.can_use_promo(req.promo_code):
            # clean up hold and reservation
            try:
                if hold_id:
                    LimitedPackageService.remove_hold(pkg.code, hold_id)
            finally:
                LimitedPackageService.release_reservation(pkg.code, req.quantity)
            return LimitedBuyReceipt(
                success=False,
                message="Promo code usage limit reached",
                user_id=user_id,
                code=pkg.code,
                quantity=req.quantity,
                total_price_cents=pkg.price_cents * req.quantity,
                gems_granted=0,
                new_gem_balance=getattr(user, "cyber_token_balance", 0),
                charge_id=None,
                reason_code="PROMO_EXHAUSTED",
            )
        off = LimitedPackageService.get_promo_discount(pkg.code, req.promo_code)
        unit_price = max(pkg.price_cents - int(off), 0)
    total_price_cents = unit_price * req.quantity
    gateway = PaymentGateway()
    auth = gateway.authorize(total_price_cents, req.currency, card_token=req.card_token)
    if not auth.success:
        # clean up hold and reservation
        try:
            if hold_id:
                LimitedPackageService.remove_hold(pkg.code, hold_id)
        finally:
            LimitedPackageService.release_reservation(pkg.code, req.quantity)
        return LimitedBuyReceipt(
            success=False,
            message=f"Payment failed: {auth.message}",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=None,
            reason_code="PAYMENT_FAILED",
        )
    cap = gateway.capture(auth.charge_id or "")
    if not cap.success:
        # clean up hold and reservation
        try:
            if hold_id:
                LimitedPackageService.remove_hold(pkg.code, hold_id)
        finally:
            LimitedPackageService.release_reservation(pkg.code, req.quantity)
        return LimitedBuyReceipt(
            success=False,
            message=f"Capture failed: {cap.message}",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gems_granted=0,
            new_gem_balance=getattr(user, "cyber_token_balance", 0),
            charge_id=auth.charge_id,
            reason_code="PAYMENT_FAILED",
        )

    token_service = TokenService(db)
    total_gems = pkg.gems * req.quantity
    new_balance = token_service.add_tokens(user_id, total_gems)

    # Reward ledger row + link
    reward = models.Reward(
        name=f"BUY_PACKAGE:{pkg.code}",
        description=f"Purchase {req.quantity}x {pkg.name}",
        reward_type="TOKEN",
        value=float(total_gems),
    )
    db.add(reward)
    db.flush()
    db.add(models.UserReward(user_id=user_id, reward_id=reward.id))

    # Action log
    db.add(models.UserAction(
        user_id=user_id,
        action_type="BUY_PACKAGE",
        action_data=f"{{'code':'{pkg.code}','price_cents':{total_price_cents},'quantity':{req.quantity},'charge_id':'{cap.charge_id}'}}",
    ))

    # finalize user limit counters
    LimitedPackageService.finalize_user_purchase(pkg.code, user_id, req.quantity)
    if req.promo_code:
        LimitedPackageService.record_promo_use(req.promo_code)

    db.commit()

    # Emit Kafka event for analytics (best-effort)
    try:
        send_kafka_message("buy_package", {
            "type": "BUY_PACKAGE",
            "user_id": user_id,
            "code": pkg.code,
            "quantity": req.quantity,
            "total_price_cents": total_price_cents,
            "gems_granted": total_gems,
            "charge_id": cap.charge_id,
            "server_ts": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    # include a synthetic receipt code for client-side tracking
    import uuid
    receipt_code = uuid.uuid4().hex[:12]
    resp = LimitedBuyReceipt(
        success=True,
        message="Purchase completed",
        user_id=user_id,
        code=pkg.code,
        quantity=req.quantity,
        total_price_cents=total_price_cents,
        gems_granted=total_gems,
        new_gem_balance=new_balance,
        charge_id=cap.charge_id,
        receipt_code=receipt_code,
    )
    # remove hold after successful finalize
    try:
        if hold_id:
            LimitedPackageService.remove_hold(pkg.code, hold_id)
    except Exception:
        pass
    # Mark idempotency after success
    if idem and rman.redis_client:
        try:
            rman.redis_client.setex(_idem_key(user_id, pkg.code, idem), IDEM_TTL, receipt_code)
        except Exception:
            pass
    return resp
