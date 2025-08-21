from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
from datetime import datetime
import time
import json
import logging
import uuid
import hmac, hashlib

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
    # Support legacy numeric product_id in tests/clients by coercing ints to str
    product_id: str = Field(..., description="Catalog product id or item code")
    # 금액 (충전형 골드 구매시는 카탈로그 가격 사용 가능)
    amount: int | None = Field(None, ge=0, description="Amount in cents or tokens depending on kind")
    quantity: int = Field(1, ge=1, le=99)
    # kind: gold | item (legacy 'gems' 제거)
    kind: Literal["gold", "item"] = Field("gold")
    payment_method: Optional[str] = Field(None, description="card|tokens etc")
    item_name: Optional[str] = None
    currency: str = Field("USD")
    card_token: Optional[str] = None
    idempotency_key: Optional[str] = Field(None, description="Client-provided idempotency key (unique per purchase attempt)")

    @field_validator('product_id', mode='before')
    def _coerce_product_id(cls, v):
        # accept integers and convert to string for backward compatibility
        try:
            if isinstance(v, (int,)):
                return str(v)
        except Exception:
            pass
        return v


class BuyReceipt(BaseModel):
    success: bool
    message: str
    user_id: int
    product_id: str
    quantity: int
    gold_granted: Optional[int] = None  # 지급된 골드 (충전/획득형 구매)
    gold_spent: Optional[int] = None    # 소비된 골드 (아이템 구매)
    new_gold_balance: Optional[int] = None  # 결과 잔액
    charge_id: Optional[str] = None
    receipt_code: Optional[str] = None
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    reason_code: Optional[str] = None

from ..services.shop_service import ShopService
from ..services.catalog_service import CatalogService
from ..services.payment_gateway import PaymentGatewayService, PaymentGateway
from ..services.token_service import TokenService
from ..dependencies import get_current_user
from ..auth.auth_service import get_current_user_optional
from ..services.limited_package_service import LimitedPackageService
from ..schemas.limited_package import LimitedPackageOut, LimitedBuyRequest, LimitedBuyReceipt
from ..kafka_client import send_kafka_message
from ..utils.redis import get_redis_manager
from ..core.config import settings
from ..utils.utils import WebhookUtils
from fastapi import Request

logger = logging.getLogger(__name__)

# --- Metrics (best-effort; 실패시 무시) ---
try:
    from prometheus_client import Counter
    PURCHASE_COUNTER = Counter(
        "purchase_attempt_total",
        "구매 시도/성공/실패 카운터",
        ["flow", "result", "reason"],
    )
except Exception:  # pragma: no cover - 라이브러리 미존재시 무시
    PURCHASE_COUNTER = None

def _metric_inc(flow: str, result: str, reason: str | None = None):  # helper
    if PURCHASE_COUNTER:
        try:
            PURCHASE_COUNTER.labels(flow=flow, result=result, reason=reason or "").inc()
        except Exception:
            pass

def get_shop_service(db = Depends(get_db)) -> ShopService:
    """Dependency provider for ShopService."""
    return ShopService(db)


class CatalogItem(BaseModel):
    id: int
    sku: str
    name: str
    price_cents: int
    discounted_price_cents: int
    gold: int
    discount_percent: int = 0
    discount_ends_at: Optional[datetime] = None
    min_rank: Optional[str] = None


@router.get("/catalog", response_model=list[CatalogItem], summary="List shop catalog (gold)")
def list_catalog():
    items = []
    for p in CatalogService.list_products():
        items.append(CatalogItem(
            id=p.id,
            sku=p.sku,
            name=p.name,
            price_cents=p.price_cents,
            discounted_price_cents=CatalogService.compute_price_cents(p, 1),
            gold=p.gold,
            discount_percent=p.discount_percent or 0,
            discount_ends_at=p.discount_ends_at,
            min_rank=p.min_rank,
        ))
    return items


@router.get("/limited-packages", response_model=List[LimitedPackageOut], summary="List active limited packages (gold)")
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
            package_id=p.code,  # legacy alias for tests expecting package_id
            name=p.name,
            description=p.description,
            price_cents=p.price_cents,
            gold=p.gold,
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


@router.get("/limited/catalog", response_model=List[LimitedPackageOut], summary="[Compat] List limited packages (gold)")
def list_limited_catalog_compat():
    packages: List[LimitedPackageOut] = []
    for p in LimitedPackageService.list_active():
        remaining_stock = LimitedPackageService.get_stock(p.code)
        packages.append(LimitedPackageOut(
            code=p.code,
            name=p.name,
            description=p.description,
            price_cents=p.price_cents,
            gold=p.gold,
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

    # --- Fraud 차단 선제 룰 (시도 직전 윈도 검사) ---
    rclient = getattr(rman, 'redis_client', None)
    FRAUD_WINDOW = 300  # 5분
    FRAUD_MAX_COUNT = 20
    FRAUD_MAX_CARD_UNIQUE = 3
    if rclient:
        try:
            now_ts = int(time.time())
            zkey = f"user:buy:ts:{user_id}"
            rclient.zremrangebyscore(zkey, 0, now_ts - FRAUD_WINDOW)
            count = rclient.zcount(zkey, now_ts - FRAUD_WINDOW, now_ts)
            skey = f"user:buy:cards:{user_id}"
            card_uniques = rclient.scard(skey) if rclient.exists(skey) else 0
            if count >= FRAUD_MAX_COUNT or card_uniques >= FRAUD_MAX_CARD_UNIQUE:
                _metric_inc("limited", "fail", "FRAUD_BLOCK")
                try:
                    db.add(models.ShopTransaction(
                        user_id=user_id,
                        product_id=pkg.code if pkg else req.code,
                        kind="gold",
                        quantity=req.quantity,
                        unit_price=0,
                        amount=0,
                        payment_method="card" if req.card_token else "unknown",
                        status="failed",
                        failure_reason="fraud_velocity_threshold",
                        extra={"limited": True, "reason": "FRAUD_BLOCK", "count_5m": int(count), "cards_5m": int(card_uniques)},
                    ))
                    db.commit()
                except Exception:
                    pass
                raise HTTPException(status_code=429, detail="Fraud velocity threshold")
        except HTTPException:
            raise
        except Exception:
            pass

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
        # 실패 트랜잭션 기록
        try:
            db.add(models.ShopTransaction(
                user_id=user_id,
                product_id=pkg.code,
                kind="gold",
                quantity=req.quantity,
                unit_price=unit_price,
                amount=total_price_cents,
                payment_method="card" if req.card_token else "unknown",
                status="failed",
                failure_reason=f"authorize:{auth.message}",
                extra={"limited": True, "stage": "authorize"},
            ))
            db.commit()
        except Exception:
            try: db.rollback()
            except Exception: pass
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
            gold_granted=0,
            new_gold_balance=getattr(user, "gold_balance", 0),
            charge_id=None,
            reason_code="PAYMENT_FAILED",
        )
    cap = capture_with_retry(gateway, auth.charge_id or "")
    if not cap.success:
        try:
            db.add(models.ShopTransaction(
                user_id=user_id,
                product_id=pkg.code,
                kind="gold",
                quantity=req.quantity,
                unit_price=unit_price,
                amount=total_price_cents,
                payment_method="card" if req.card_token else "unknown",
                status="failed",
                failure_reason=f"capture:{cap.message}",
                extra={"limited": True, "stage": "capture", "charge_id": auth.charge_id},
            ))
            db.commit()
        except Exception:
            try: db.rollback()
            except Exception: pass
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
            gold_granted=0,
            new_gold_balance=getattr(user, "gold_balance", 0),
            charge_id=auth.charge_id,
            reason_code="PAYMENT_FAILED",
        )

    # 골드 지급
    from app.services.currency_service import CurrencyService
    total_gold = getattr(pkg, 'gold', 0) * req.quantity
    try:
        new_gold_balance = CurrencyService(db).add(user_id, total_gold, 'gem')  # 내부적으로 gold 처리
    except Exception:
        try: db.rollback()
        except Exception: pass
        return LimitedBuyReceipt(
            success=False,
            message="골드 지급 실패",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gold_granted=0,
            new_gold_balance=getattr(user, "gold_balance", 0),
            charge_id=cap.charge_id,
            reason_code="GRANT_FAILED",
        )

    # Reward + action log
    reward = models.Reward(
        name=f"BUY_PACKAGE:{pkg.code}",
        description=f"Purchase {req.quantity}x {pkg.name}",
        reward_type="GOLD",
        value=float(total_gold),
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
            "gold_granted": total_gold,
            "charge_id": cap.charge_id,
            "server_ts": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    # synthetic receipt + cleanup hold
    import uuid
    receipt_code = uuid.uuid4().hex[:12]
    # receipt_signature 생성 (회전 가능한 secret 사용: PAYMENT_WEBHOOK_SECRET 재사용 또는 전용 키 추후 분리)
    secret = settings.PAYMENT_WEBHOOK_SECRET.encode()
    sig_payload = f"{user_id}|{pkg.code}|{req.quantity}|{total_price_cents}|{cap.charge_id}|{int(time.time())}".encode()
    receipt_signature = hmac.new(secret, sig_payload, hashlib.sha256).hexdigest()
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
        gold_granted=total_gold,
        new_gold_balance=new_gold_balance,
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

@router.post("/webhook/payment", summary="Payment Webhook (Replay & 멱등 보호)")
async def payment_webhook(request: Request):
    """결제 프로바이더 웹훅 수신.
    보안 계층:
      1) HMAC 서명 검증 (X-Signature)
      2) 재생(Replay) 방어: X-Timestamp + X-Nonce (서로 결합한 키 Redis SETNX, 시간왜곡 허용 ±300s)
      3) 이벤트 멱등: X-Event-Id 헤더 또는 payload.event_id 기준 Redis SETNX (중복시 duplicate 응답)

    기대 헤더:
      - X-Signature: sha256=<hex>
      - X-Timestamp: unix epoch seconds
      - X-Nonce: 임의 UUID/난수 문자열
      - (선택) X-Event-Id: 공급자 이벤트 고유 ID
    """
    raw_body = await request.body()
    headers = request.headers
    provided_sig = headers.get("X-Signature", "")
    ts_header = headers.get("X-Timestamp")
    nonce = headers.get("X-Nonce")
    event_id_hdr = headers.get("X-Event-Id")

    # 1. 서명 검증
    try:
        expected_sig = WebhookUtils.generate_webhook_signature(raw_body.decode("utf-8"), settings.PAYMENT_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")
    import hmac
    if not (provided_sig and hmac.compare_digest(provided_sig, expected_sig)):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 2. Timestamp / Nonce 필수
    if not ts_header or not nonce:
        raise HTTPException(status_code=400, detail="Missing timestamp/nonce")
    try:
        ts_val = int(ts_header)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp")
    now = int(time.time())
    ALLOWED_SKEW = 300  # 5분
    if abs(now - ts_val) > ALLOWED_SKEW:
        raise HTTPException(status_code=400, detail="Stale timestamp")

    # 3. Redis 기반 Replay 방어 (ts+nonce 조합)
    rman = get_redis_manager()
    replay_key = f"webhook:pay:replay:{ts_val}:{nonce}"
    REPLAY_TTL = 600  # 10분
    client = getattr(rman, 'redis_client', None)
    if client:
        try:
            if not client.set(replay_key, "1", nx=True, ex=REPLAY_TTL):
                # 이미 처리된 (replay)
                raise HTTPException(status_code=409, detail="Replay detected")
        except HTTPException:
            raise
        except Exception as e:  # Redis 장애시 degrade
            logger.warning(f"Replay key set 실패(degrade): {e}")

    # 4. Payload 파싱 (event_id 추출)
    event_id = event_id_hdr
    payload_json = None
    if not event_id:
        try:
            payload_json = json.loads(raw_body.decode("utf-8"))
            event_id = payload_json.get("event_id") if isinstance(payload_json, dict) else None
        except Exception:
            # event_id 없이도 서명/재생 방어 되었다면 계속 진행
            payload_json = None

    # 5. 이벤트 멱등 처리
    duplicate = False
    if event_id and client:
        idemp_key = f"webhook:pay:event:{event_id}"
        IDEMP_TTL = 60 * 60 * 24  # 24h
        try:
            if not client.set(idemp_key, "1", nx=True, ex=IDEMP_TTL):
                duplicate = True
        except Exception as e:
            logger.warning(f"Webhook event idempotency set 실패(degrade): {e}")

    # TODO: 실제 비즈니스 처리 (예: 결제 상태 업데이트, 보상 지급 등)
    return {"ok": True, "duplicate": duplicate}

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
                new_gold_balance=result.get("new_gold_balance") or result.get("new_balance"),
                item_id=request.item_id,
                item_name=request.item_name,
                new_item_count=0
            )

        return ShopPurchaseResponse(
            success=True,
            message=result["message"],
            new_gold_balance=result.get("new_gold_balance") or result.get("new_balance"),
            item_id=result["item_id"],
            item_name=result["item_name"],
            new_item_count=result["new_item_count"]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/buy", response_model=BuyReceipt, summary="Buy gold top-up or items")
def buy(
    req: BuyRequest,
    db = Depends(get_db),
    current_user = Depends(get_current_user_optional),
):
    # Prefer authenticated user; for dev/test allow fallback to body.user_id when safe
    user = current_user
    req_user_id = getattr(user, "id", None) if user else None
    if not req_user_id:
        # Allow using body-provided user_id in development/test environments for compatibility with legacy tests
        import os
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env in {"dev", "development", "local", "test"} and getattr(req, 'user_id', None):
            req_user_id = req.user_id
            user = db.query(models.User).filter(models.User.id == req_user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        else:
            raise HTTPException(status_code=401, detail="Unauthorized")

    shop_svc = ShopService(db)

    # Back-compat: if amount not provided, try to fetch from catalog
    prod = None
    if req.amount is None:
        try:
            # CatalogService keys are integers for legacy numeric product ids
            try:
                pid_int = int(req.product_id)
            except Exception:
                pid_int = None
            if pid_int is not None:
                prod = CatalogService.get_product(pid_int)
            else:
                # try SKU/name match
                for p in CatalogService.list_products():
                    if getattr(p, 'sku', '').lower() == str(req.product_id).lower() or p.name == req.product_id:
                        prod = p
                        break
            if prod is not None:
                # catalog price stored in cents
                req.amount = int(getattr(prod, 'price_cents', getattr(prod, 'price', 0)))
        except Exception:
            # leave as None; later code handles missing amount
            prod = None

    # Enforce product-level restrictions (e.g., VIP-only) early
    try:
        if prod is not None and getattr(prod, 'min_rank', None):
            user_rank = getattr(user, 'rank', None) or getattr(user, 'role', None)
            if user_rank != getattr(prod, 'min_rank'):
                raise HTTPException(status_code=403, detail="VIP required")
    except HTTPException:
        raise
    except Exception:
        pass

    # Idempotency protection for gold/item purchases (best-effort via Redis)
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
                gold_granted=0,
                new_gold_balance=getattr(user, "gold_balance", 0),
                charge_id=None,
                receipt_code=None,
            )

    if req.kind == "item":
        # 통화 차감 우선 (기존 cyber_token_balance -> premium_gem_balance 또는 coin 구분)
        from app.services.currency_service import CurrencyService, InsufficientBalanceError
        cur_svc = CurrencyService(db)
        currency_mode = 'gem'  # 향후 req.payload 확장으로 선택 가능
        try:
            new_bal = cur_svc.deduct(req_user_id, req.amount, 'gem' if currency_mode == 'gem' else 'coin')
        except InsufficientBalanceError as ie:
            return BuyReceipt(
                success=False,
                message=str(ie),
                user_id=req_user_id,
                product_id=req.product_id,
                quantity=req.quantity,
                item_id=req.product_id,
                item_name=req.item_name or req.product_id,
                new_gold_balance=getattr(user, "gold_balance", 0),
            )
        # Item DB 기록 (기존 ShopService 로직 재사용)
        result = shop_svc.purchase_item(
            user_id=req_user_id,
            item_id=0,
            item_name=req.item_name or req.product_id,
            price=req.amount,
            description=None,
            product_id=req.product_id,
        )
        if not result["success"]:
            # 실패 시 롤백으로 잔액 보정 고려(현재 단순 실패 반환)
            return BuyReceipt(
                success=False,
                message=result["message"],
                user_id=req_user_id,
                product_id=req.product_id,
                quantity=req.quantity,
                item_id=req.product_id,
                item_name=req.item_name or req.product_id,
                new_gold_balance=new_bal,
            )
        resp = BuyReceipt(
            success=True,
            message=result["message"],
            user_id=req_user_id,
            product_id=req.product_id,
            quantity=req.quantity,
            item_id=result.get("item_id"),
            item_name=result.get("item_name"),
            new_gold_balance=new_bal,
        )
        if idem and rman.redis_client:
            try:
                rman.redis_client.setex(_idem_key(req_user_id, req.product_id, idem), IDEM_TTL, "1")
            except Exception:
                pass
        return resp

    # If idempotency key provided, attempt to reuse existing transaction
    reused_receipt = None
    existing_tx = None
    if idem:
        try:
            existing_tx = (
                db.query(models.ShopTransaction)
                .filter(
                    models.ShopTransaction.user_id == req_user_id,
                    models.ShopTransaction.product_id == req.product_id,
                    models.ShopTransaction.idempotency_key == idem,
                )
                .order_by(models.ShopTransaction.id.asc())
                .first()
            ) if shop_svc._table_exists('shop_transactions') else None
            if existing_tx:
                reused_receipt = existing_tx.receipt_code
                # 상태 분기: success/failed 즉시 재사용, pending이면 게이트웨이 폴링
                if existing_tx.status in ("success", "failed"):
                        # Legacy derivation removed: gems -> gold (tx_gold)
                        try:
                            tx_prod = None
                            try:
                                tx_pid_int = int(existing_tx.product_id)
                            except Exception:
                                tx_pid_int = None
                            if tx_pid_int is not None:
                                tx_prod = CatalogService.get_product(tx_pid_int)
                            if tx_prod is not None:
                                tx_gold = int(getattr(tx_prod, 'gold', 0)) * (existing_tx.quantity or req.quantity)
                            else:
                                tx_gold = int(existing_tx.amount) if existing_tx.amount is not None else 0
                        except Exception:
                            tx_gold = int(existing_tx.amount) if existing_tx.amount is not None else 0
                        return BuyReceipt(
                            success=(existing_tx.status == 'success'),
                            message="구매 완료" if existing_tx.status == 'success' else "결제 실패 재사용",
                            user_id=req_user_id,
                            product_id=req.product_id,
                            quantity=existing_tx.quantity or req.quantity,
                            gold_granted=tx_gold if existing_tx.status == 'success' else 0,
                            new_gold_balance=getattr(user, "gold_balance", 0),
                            charge_id=getattr(existing_tx, 'charge_id', None) if hasattr(existing_tx, 'charge_id') else None,
                            receipt_code=reused_receipt,
                            reason_code=None if existing_tx.status == 'success' else 'PAYMENT_DECLINED',
                        )
                elif existing_tx.status == 'pending':
                    # gateway_reference 확보 후 폴링 시도
                    gateway_reference = None
                    try:
                        if isinstance(existing_tx.extra, dict):
                            gateway_reference = existing_tx.extra.get('gateway_reference')
                    except Exception:
                        gateway_reference = None
                    if gateway_reference:
                        gateway = PaymentGatewayService()
                        try:
                            pres = gateway.check_status(gateway_reference)
                        except Exception:
                            pres = {"status": "pending"}
                        polled_status = pres.get("status")
                        if polled_status == 'success':
                            # 토큰 아직 지급 안된 상태라면 지급 → amount는 gold 수량으로 간주
                            try:
                                from app.services.currency_service import CurrencyService
                                CurrencyService(db).add(req_user_id, existing_tx.amount, 'gem')
                            except Exception:
                                try: db.rollback()
                                except Exception: pass
                                return BuyReceipt(
                                    success=False,
                                    message="골드 지급 실패",
                                    user_id=req_user_id,
                                    product_id=req.product_id,
                                    quantity=existing_tx.quantity or req.quantity,
                                    receipt_code=existing_tx.receipt_code,
                                    new_gold_balance=getattr(user, "gold_balance", 0),
                                    reason_code="GRANT_FAILED",
                                )
                            existing_tx.status = 'success'
                            try:
                                db.commit()
                            except Exception:
                                db.rollback()
                            return BuyReceipt(
                                success=True,
                                message="구매 완료",
                                user_id=req_user_id,
                                product_id=req.product_id,
                                quantity=existing_tx.quantity or req.quantity,
                                gold_granted=existing_tx.amount,
                                new_gold_balance=getattr(user, "gold_balance", 0),
                                charge_id=getattr(existing_tx, 'charge_id', None) if hasattr(existing_tx, 'charge_id') else None,
                                receipt_code=existing_tx.receipt_code,
                            )
                        elif polled_status == 'failed':
                            existing_tx.status = 'failed'
                            try:
                                db.commit()
                            except Exception:
                                db.rollback()
                            return BuyReceipt(
                                success=False,
                                message="결제 거절됨",
                                user_id=req_user_id,
                                product_id=req.product_id,
                                quantity=existing_tx.quantity or req.quantity,
                                gold_granted=0,
                                receipt_code=existing_tx.receipt_code,
                                new_gold_balance=getattr(user, "gold_balance", 0),
                                reason_code="PAYMENT_DECLINED",
                            )
                        # 여전히 pending → 현재 상태 그대로 반환
                        return BuyReceipt(
                            success=False,
                            message="결제 대기 중",
                            user_id=req_user_id,
                            product_id=req.product_id,
                            quantity=existing_tx.quantity or req.quantity,
                            gold_granted=0,
                            receipt_code=existing_tx.receipt_code,
                            new_gold_balance=getattr(user, "gold_balance", 0),
                            reason_code="PAYMENT_PENDING",
                        )
        except Exception:
            existing_tx = None
    # Validate/derive amount before proceeding (legacy tests omit amount)
    if req.amount is None:
        # Final fallback: if still None after earlier catalog attempt, treat as 0 and fail gracefully later
        try:
            if prod is not None:
                req.amount = int(getattr(prod, 'price_cents', 0))
            else:
                # Unknown product with no amount provided
                raise HTTPException(status_code=400, detail="amount missing for product")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="invalid amount")

    # Gold purchase via external gateway (can be pending)
    gateway = PaymentGatewayService()
    # Create pending transaction record
    from datetime import datetime as _dt
    import uuid
    receipt_code = uuid.uuid4().hex[:12]
    if existing_tx and existing_tx.status == 'pending':
        # Update existing pending tx (no new row)
        receipt_code = existing_tx.receipt_code
    else:
        shop_svc.record_transaction(
            user_id=req_user_id,
            product_id=req.product_id,
            kind='gold',
            quantity=req.quantity,
            unit_price=int(req.amount) if req.amount is not None else 0,
            amount=int(req.amount) if req.amount is not None else 0,
            payment_method=req.payment_method or 'card',
            status='pending',
            receipt_code=reused_receipt or receipt_code,
            extra={"currency": req.currency},
            idempotency_key=idem,
        )
        if reused_receipt:
            receipt_code = reused_receipt
    # Also append a lightweight action log for environments without transactions table
    try:
        db.add(models.UserAction(
            user_id=req_user_id,
            action_type='PURCHASE_GOLD',
            action_data=(
                f'{{"product_id":"{req.product_id}","kind":"gold","quantity":{req.quantity},'
                f'"amount":{int(req.amount)},"payment_method":"{req.payment_method or "card"}",' 
                f'"status":"pending","receipt_code":"{receipt_code}"}}'
            )
        ))
        db.commit()
    except Exception:
        db.rollback()
    pres = gateway.process_payment(amount=int(req.amount), method=req.payment_method, metadata={"product_id": req.product_id})
    status = pres.get("status")
    if status == "failed":
        # Update to failed
        db_tx = existing_tx or shop_svc.get_tx_by_receipt_for_user(req_user_id, receipt_code)
        if db_tx:
            db_tx.status = 'failed'
            if idem and not getattr(db_tx, 'idempotency_key', None):
                try: db_tx.idempotency_key = idem
                except Exception: pass
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
            gold_granted=0,
            receipt_code=receipt_code,
            new_gold_balance=getattr(user, "gold_balance", 0),
            reason_code="PAYMENT_DECLINED",
        )
    elif status == "pending":
        # Update action log with gateway_reference for later settlement mapping
        try:
            db.add(models.UserAction(
                user_id=req_user_id,
                action_type='PURCHASE_GOLD',
                action_data=(
                    f'{{"product_id":"{req.product_id}","kind":"gold","quantity":{req.quantity},'
                    f'"amount":{int(req.amount)},"payment_method":"{req.payment_method or "card"}",' 
                    f'"status":"pending","receipt_code":"{receipt_code}","gateway_reference":"{pres.get("gateway_reference")}"}}'
                )
            ))
            db.commit()
        except Exception:
            db.rollback()
        # 트랜잭션 extra에 gateway_reference 저장 (최초 pending 생성 시)
        try:
            db_tx = existing_tx or shop_svc.get_tx_by_receipt_for_user(req_user_id, receipt_code)
            if db_tx:
                if not isinstance(db_tx.extra, dict):
                    db_tx.extra = {"currency": req.currency}
                db_tx.extra.setdefault('currency', req.currency)
                db_tx.extra['gateway_reference'] = pres.get('gateway_reference')
                db.commit()
        except Exception:
            db.rollback()
        return BuyReceipt(
            success=False,
            message="결제 대기 중",
            user_id=req_user_id,
            product_id=req.product_id,
            quantity=req.quantity,
            gold_granted=0,
            receipt_code=receipt_code,
            new_gold_balance=getattr(user, "gold_balance", 0),
            reason_code="PAYMENT_PENDING",
        )
    else:
        # success immediately
        # If catalog product known, use its gold * quantity; otherwise fall back to amount-as-gold.
        # BUGFIX: 이전 코드가 제거된 gems 필드를 참조(getattr(prod,'gems',0))하여 항상 0 지급 → gold 필드로 교체
        try:
            if prod is not None:
                total_gold = int(getattr(prod, 'gold', 0)) * req.quantity
            else:
                total_gold = int(req.amount)
            from app.services.currency_service import CurrencyService
            new_gold_balance = CurrencyService(db).add(req_user_id, total_gold, 'gem')  # 'gem' alias → gold_balance 반영
        except Exception:
            try:
                db.rollback()
            except Exception:
                pass
            return BuyReceipt(
                success=False,
                message="골드 지급 실패",
                user_id=req_user_id,
                product_id=req.product_id,
                quantity=req.quantity,
                receipt_code=receipt_code,
                new_gold_balance=getattr(user, "gold_balance", 0),
                reason_code="GRANT_FAILED",
            )
        # mark success
    db_tx = existing_tx or shop_svc.get_tx_by_receipt_for_user(req_user_id, receipt_code)
    if db_tx:
        db_tx.status = 'success'
        try:
            # store idempotency key if not already (for reuse)
            if idem and not getattr(db_tx, 'idempotency_key', None):
                try:
                    db_tx.idempotency_key = idem
                except Exception:
                    pass
            db.commit()
        except Exception:
            db.rollback()

    resp = BuyReceipt(
        success=True,
        message="구매 완료",
        user_id=req_user_id,
        product_id=req.product_id,
        quantity=req.quantity,
    gold_granted=total_gold,
        new_gold_balance=new_gold_balance,
        charge_id=pres.get("gateway_reference") if isinstance(pres, dict) else None,
        receipt_code=receipt_code,
    )
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
    # Ensure variables used in multiple branches are defined to avoid UnboundLocalError in edge paths
    receipt_signature = None
    # Idempotency guard for limited purchases
    rman = get_redis_manager()
    idem = (getattr(req, 'idempotency_key', None) or '').strip() or None
    IDEM_TTL = 60 * 10
    def _idem_key(uid: int, code: str, key: str) -> str:
        return f"shop:limited:idemp:{uid}:{code}:{key}"
    def _idem_lock_key(uid: int, code: str, key: str) -> str:
        return f"shop:limited:idemp_lock:{uid}:{code}:{key}"

    _metric_inc("limited", "start", None)

    # Rate limiting (10초 5회) - 단, 프로모 코드 사용 시 먼저 프로모 사용 가능 여부 체크 후 적용
    # (PROMO_EXHAUSTED 응답이 RATE_LIMIT보다 우선되도록 하여 테스트 기대 충족)
    defer_rate_limit_check = bool(req.promo_code)
    rate_limited = False
    if rman.redis_client and not defer_rate_limit_check:
        try:
            rl_key = f"rl:buy-limited:{user_id}"
            cnt = rman.redis_client.incr(rl_key)
            if cnt == 1:
                rman.redis_client.expire(rl_key, 10)
            if cnt > 5:
                rate_limited = True
                _metric_inc("limited", "fail", "RATE_LIMIT")
                return LimitedBuyReceipt(success=False, message="Rate limit exceeded", user_id=user_id, code=req.package_id, reason_code="RATE_LIMIT")
        except Exception:
            pass

    # Idempotency pre-lock: 동시 중복 처리 방지
    if idem and rman.redis_client:
        try:
            if rman.redis_client.exists(_idem_key(user_id, req.package_id, idem)):
                # 이미 성공 처리됨
                cur_user = db.query(models.User).filter(models.User.id == user_id).first()
                return LimitedBuyReceipt(success=True, message="중복 요청 처리됨", user_id=user_id, code=req.package_id, new_gold_balance=getattr(cur_user, 'gold_balance', 0) if cur_user else None)
            # pre-lock 획득 시도
            if not rman.redis_client.set(_idem_lock_key(user_id, req.package_id, idem), "1", nx=True, ex=60):
                _metric_inc("limited", "fail", "PROCESSING")
                return LimitedBuyReceipt(success=False, message="Processing duplicate", user_id=user_id, code=req.package_id, reason_code="PROCESSING")
        except Exception:
            pass
    pkg = LimitedPackageService.get(req.package_id)
    if not pkg:
        _metric_inc("limited", "fail", "NOT_FOUND")
        return LimitedBuyReceipt(success=False, message="Package not found", user_id=user_id, reason_code="NOT_FOUND")
    now = datetime.utcnow()
    # normalize to naive for comparison if needed
    if hasattr(pkg.start_at, 'tzinfo') and pkg.start_at.tzinfo is not None:
        now = datetime.now(pkg.start_at.tzinfo)
    if not (pkg.is_active and pkg.start_at <= now <= pkg.end_at):
        cur_user = db.query(models.User).filter(models.User.id == user_id).first()
        _metric_inc("limited", "fail", "WINDOW_CLOSED")
        return LimitedBuyReceipt(
            success=False,
            message="Package not available",
            user_id=user_id,
            code=pkg.code,
            reason_code="WINDOW_CLOSED",
            new_gold_balance=getattr(cur_user, 'gold_balance', 0) if cur_user else None,
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        _metric_inc("limited", "fail", "UNAUTHORIZED")
        return LimitedBuyReceipt(
            success=False,
            message="User not found",
            user_id=user_id,
            reason_code="UNAUTHORIZED",
            new_gold_balance=None,
        )

    # Fast path: if idempotency key already seen, acknowledge
    # Fast path (이미 pre-lock 전 성공 케이스 확인은 위에서 처리) - 유지 목적 주석

    # per-user limit
    already = LimitedPackageService.get_user_purchased(pkg.code, user_id)
    if pkg.per_user_limit and already + req.quantity > pkg.per_user_limit:
        _metric_inc("limited", "fail", "USER_LIMIT")
        return LimitedBuyReceipt(
            success=False,
            message="Per-user limit exceeded",
            user_id=user_id,
            code=pkg.code,
            reason_code="USER_LIMIT",
            new_gold_balance=getattr(user, 'gold_balance', 0),
        )

    # Sweep expired holds to return any timed-out reservations back to stock (best-effort)
    try:
        LimitedPackageService.sweep_expired_holds(pkg.code)
    except Exception:
        pass

    # stock reservation
    hold_id: Optional[str] = None
    if not LimitedPackageService.try_reserve(pkg.code, req.quantity):
        _metric_inc("limited", "fail", "OUT_OF_STOCK")
        return LimitedBuyReceipt(
            success=False,
            message="Out of stock",
            user_id=user_id,
            code=pkg.code,
            reason_code="OUT_OF_STOCK",
            new_gold_balance=getattr(user, 'gold_balance', 0),
        )

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
            _metric_inc("limited", "fail", "PROMO_EXHAUSTED")
            return LimitedBuyReceipt(
                success=False,
                message="Promo code usage limit reached",
                user_id=user_id,
                code=pkg.code,
                quantity=req.quantity,
                total_price_cents=pkg.price_cents * req.quantity,
                gold_granted=0,
                new_gold_balance=getattr(user, "gold_balance", 0),
                charge_id=None,
                reason_code="PROMO_EXHAUSTED",
            )
        off = LimitedPackageService.get_promo_discount(pkg.code, req.promo_code)
        unit_price = max(pkg.price_cents - int(off), 0)
    # 프로모 코드 체크 후 지연된 rate limit 검사 수행 (프로모 없는 경우는 앞에서 이미 완료)
    if defer_rate_limit_check and rman.redis_client:
        try:
            rl_key = f"rl:buy-limited:{user_id}"
            cnt = rman.redis_client.incr(rl_key)
            if cnt == 1:
                rman.redis_client.expire(rl_key, 10)
            if cnt > 5:
                _metric_inc("limited", "fail", "RATE_LIMIT")
                return LimitedBuyReceipt(success=False, message="Rate limit exceeded", user_id=user_id, code=req.package_id, reason_code="RATE_LIMIT")
        except Exception:
            pass
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
        _metric_inc("limited", "fail", "PAYMENT_AUTH")
        return LimitedBuyReceipt(
            success=False,
            message=f"Payment failed: {auth.message}",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gold_granted=0,
            new_gold_balance=getattr(user, "gold_balance", 0),
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
        _metric_inc("limited", "fail", "PAYMENT_CAPTURE")
        return LimitedBuyReceipt(
            success=False,
            message=f"Capture failed: {cap.message}",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gold_granted=0,
            new_gold_balance=getattr(user, "gold_balance", 0),
            charge_id=auth.charge_id,
            reason_code="PAYMENT_FAILED",
        )

    from app.services.currency_service import CurrencyService
    total_gold = getattr(pkg, 'gold', 0) * req.quantity  # 이전 gems 필드 대체
    try:
        new_gold_balance = CurrencyService(db).add(user_id, total_gold, 'gem')  # 내부적으로 gold 처리
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        return LimitedBuyReceipt(
            success=False,
            message="골드 지급 실패",
            user_id=user_id,
            code=pkg.code,
            quantity=req.quantity,
            total_price_cents=total_price_cents,
            gold_granted=0,
            new_gold_balance=getattr(user, "gold_balance", 0),
            charge_id=cap.charge_id,
            reason_code="GRANT_FAILED",
        )

    # Reward ledger row + link
    reward = models.Reward(
        name=f"BUY_PACKAGE:{pkg.code}",
        description=f"Purchase {req.quantity}x {pkg.name}",
        reward_type="TOKEN",
        value=float(total_gold),
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

    # Generate receipt early for persistence
    receipt_code = uuid.uuid4().hex[:12]

    # 트랜잭션 영속화 (limited purchase)
    try:
        import hashlib, sqlalchemy as sa
        raw = f"{user_id}|{pkg.code}|{req.quantity}|{unit_price}|{total_price_cents}|{cap.charge_id}|{receipt_code}".encode()
        integrity_hash = hashlib.sha256(raw).hexdigest()
        insp_cols = [c['name'] for c in sa.inspect(db.bind).get_columns('shop_transactions')]
        has_col = lambda c: c in insp_cols  # noqa: E731
        # 공통 파라미터
        base_params = dict(
            user_id=user_id,
            product_id=pkg.code,
            kind='gold',
            quantity=req.quantity,
            unit_price=unit_price,
            amount=total_price_cents,
            payment_method='card' if req.card_token else 'unknown',
            status='success',
            receipt_code=receipt_code,
            integrity_hash=integrity_hash,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        if has_col('receipt_signature'):
            base_params['receipt_signature'] = receipt_signature
        if has_col('idempotency_key'):
            base_params['idempotency_key'] = None
        # 최신 스키마(extra 존재) → ORM 사용 (flush로 즉시 검증)
        if has_col('extra'):
            db.add(models.ShopTransaction(
                **{k: v for k, v in base_params.items() if k not in {'created_at','updated_at'}},
                extra={
                    'limited': True,
                    'promo_code': req.promo_code,
                    'charge_id': cap.charge_id,
                },
            ))
            db.flush()  # flush here so schema 문제 즉시 감지
        else:
            # 레거시 스키마: 수동 INSERT (extra 컬럼 생략)
            cols_clause = ",".join(base_params.keys())
            values_clause = ",".join(f":{k}" for k in base_params.keys())
            db.execute(sa.text(f"INSERT INTO shop_transactions ({cols_clause}) VALUES ({values_clause})"), base_params)
    except Exception:
        _metric_inc("limited", "fail", "TX_PERSIST")

    db.commit()

    # Emit Kafka event for analytics (best-effort)
    try:
        send_kafka_message("buy_package", {
            "type": "BUY_PACKAGE",
            "user_id": user_id,
            "code": pkg.code,
            "quantity": req.quantity,
            "total_price_cents": total_price_cents,
            "gold_granted": total_gold,
            "charge_id": cap.charge_id,
            "server_ts": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    # include a synthetic receipt code for client-side tracking
    resp = LimitedBuyReceipt(
        success=True,
        message="Purchase completed",
        user_id=user_id,
        code=pkg.code,
        quantity=req.quantity,
        total_price_cents=total_price_cents,
    gold_granted=total_gold,
    new_gold_balance=new_gold_balance,
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
            # pre-lock 키 제거 후 성공 키 기록
            try:
                rman.redis_client.delete(_idem_lock_key(user_id, pkg.code, idem))
            except Exception:
                pass
            rman.redis_client.setex(_idem_key(user_id, pkg.code, idem), IDEM_TTL, receipt_code)
        except Exception:
            pass

    # Fraud velocity 1차 룰 (사후 기록) - 임계 초과 시에도 성공 후 별도 처리 가능
    if rman.redis_client:
        try:
            zkey = f"user:buy:ts:{user_id}"
            now_ts = int(time.time())
            rman.redis_client.zadd(zkey, {str(now_ts): now_ts})
            rman.redis_client.zremrangebyscore(zkey, 0, now_ts - 300)
            rman.redis_client.expire(zkey, 600)
            if req.card_token:
                skey = f"user:buy:cards:{user_id}"
                rman.redis_client.sadd(skey, req.card_token)
                rman.redis_client.expire(skey, 600)
        except Exception:
            pass

    _metric_inc("limited", "success", None)
    return resp
