from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime
import json
import uuid

from .. import models
from ..database import get_db
from ..dependencies import get_current_user
from app.core.config import settings

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

from ..services.shop_service import ShopService

def get_shop_service(db = Depends(get_db)) -> ShopService:
    """Dependency provider for ShopService."""
    return ShopService(db)

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


class ShopBuyRequest(BaseModel):
    user_id: int
    product_id: str = Field(..., description="상품 ID 또는 패키지 ID")
    amount: int = Field(..., ge=0, description="금액(토큰 또는 결제액)")
    quantity: int = Field(1, ge=1)
    kind: Literal['gems', 'item'] = Field('gems', description="구매 유형: gems(프리미엄 잼 충전) 또는 item(아이템 구매)")
    item_name: Optional[str] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None


class ShopBuyResponse(BaseModel):
    success: bool
    message: str
    new_balance: int
    granted_gems: Optional[int] = None
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    new_item_count: Optional[int] = None


class ShopProductOut(BaseModel):
    product_id: str
    name: str
    description: Optional[str] = None
    price: int
    extra: Optional[Dict[str, Any]] = None


class PriceResponse(BaseModel):
    product_id: str
    base_price: int
    final_price: int
    discounts_applied: List[Dict[str, Any]]


class TransactionOut(BaseModel):
    product_id: Optional[str] = None
    kind: Optional[str] = None
    quantity: Optional[int] = 1
    unit_price: Optional[int] = None
    amount: Optional[int] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_code: Optional[str] = None
    created_at: Optional[str] = None


@router.get("/products", response_model=List[ShopProductOut], summary="List active products")
def list_products(shop_service: ShopService = Depends(get_shop_service)):
    return shop_service.list_active_products()


@router.get("/price/{product_id}", response_model=PriceResponse, summary="Compute server-side price")
def get_price(product_id: str, shop_service: ShopService = Depends(get_shop_service)):
    try:
        data = shop_service.compute_price(product_id)
        return PriceResponse(product_id=product_id, **data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/transactions", response_model=List[TransactionOut], summary="List my transactions")
def list_my_transactions(
    limit: int = 20,
    current_user: models.User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
):
    return shop_service.list_transactions(current_user.id, limit=limit)


@router.get("/transactions/{receipt_code}", response_model=TransactionOut, summary="Get my transaction by receipt")
def get_my_transaction(
    receipt_code: str,
    current_user: models.User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
):
    tx = shop_service.get_tx_by_receipt_for_user(current_user.id, receipt_code)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionOut(
        product_id=tx.product_id,
        kind=tx.kind,
        quantity=tx.quantity,
        unit_price=tx.unit_price,
        amount=tx.amount,
        status=tx.status,
        payment_method=tx.payment_method,
        receipt_code=tx.receipt_code,
        created_at=tx.created_at.isoformat() if getattr(tx, 'created_at', None) else None,
    )


@router.post("/transactions/{receipt_code}/settle", summary="Poll/settle a pending gems transaction")
def settle_my_pending_transaction(
    receipt_code: str,
    current_user: models.User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
):
    # 간단한 보호: 사용자 소유 거래만 처리
    res = shop_service.settle_pending_gems_for_user(current_user.id, receipt_code)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Failed"))
    return res


class WebhookPayload(BaseModel):
    receipt_code: str
    status: Literal['success', 'failed', 'pending']


@router.post("/webhook/payment")
def payment_webhook(
    payload: WebhookPayload,
    x_webhook_secret: Optional[str] = Header(default=None, alias="x-webhook-secret"),
    shop_service: ShopService = Depends(get_shop_service),
):
    # Optional shared secret gate (dev/prod configurable)
    secret = getattr(settings, 'WEBHOOK_SHARED_SECRET', None)
    if secret:
        if not x_webhook_secret or x_webhook_secret != secret:
            raise HTTPException(status_code=401, detail="Unauthorized webhook")
    # settle based on declared status
    if payload.status == 'pending':
        return {"success": True, "status": 'pending'}
    outcome = 'success' if payload.status == 'success' else 'failed'
    res = shop_service.admin_force_settle(receipt_code=payload.receipt_code, outcome=outcome)  # type: ignore[arg-type]
    if not res.get('success'):
        raise HTTPException(status_code=400, detail=res.get('message'))
    return res


class LimitedPackageOut(BaseModel):
    package_id: str
    name: str
    description: Optional[str] = None
    price: int
    stock_remaining: Optional[int] = None
    per_user_limit: Optional[int] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    emergency_disabled: bool
    contents: Optional[Dict[str, Any]] = None


@router.get("/limited-packages", response_model=List[LimitedPackageOut])
def list_limited_packages(shop_service: ShopService = Depends(get_shop_service)):
    return shop_service.list_limited_available()


class BuyLimitedRequest(BaseModel):
    package_id: str
    promo_code: Optional[str] = None


class BuyLimitedResponse(BaseModel):
    success: bool
    message: str
    new_balance: Optional[int] = None
    receipt_code: Optional[str] = None
    granted: Optional[Dict[str, Any]] = None


@router.post("/buy-limited", response_model=BuyLimitedResponse)
def buy_limited(
    body: BuyLimitedRequest,
    current_user: models.User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
):
    res = shop_service.purchase_limited(current_user.id, body.package_id, body.promo_code)
    if not res.get('success'):
        return BuyLimitedResponse(success=False, message=res.get('message', 'Failed'))
    return BuyLimitedResponse(**res)  # type: ignore[arg-type]


@router.post("/buy", response_model=ShopBuyResponse, summary="Buy gems or item", description="프리미엄 잼 충전 또는 아이템 구매 처리")
def buy(
    body: ShopBuyRequest,
    shop_service: ShopService = Depends(get_shop_service),
    db = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        # Trust authenticated user over body.user_id
        user_id = getattr(current_user, 'id', None) or body.user_id
        # gems: 충전(토큰을 프리미엄 잼으로 사용) / item: 아이템 구매(토큰 차감)
        if body.kind == 'gems':
            # 결제 선처리: 결제 수단이 지정된 경우 게이트웨이 처리
            gateway_ref = None
            if body.payment_method:
                try:
                    from ..services.payment_gateway import PaymentGatewayService
                    gateway = PaymentGatewayService()
                    pay = gateway.process_payment(amount=body.amount * max(1, body.quantity), method=body.payment_method, metadata={"product_id": body.product_id, "kind": body.kind})
                    gateway_ref = pay.get("gateway_reference")
                    if pay.get("status") == "failed":
                        # Record failed transaction
                        try:
                            receipt_code = gateway_ref or uuid.uuid4().hex[:12]
                            shop_service.record_transaction(
                                user_id=user_id,
                                product_id=body.product_id,
                                kind='gems',
                                quantity=body.quantity,
                                unit_price=body.amount,
                                amount=body.amount * max(1, body.quantity),
                                payment_method=body.payment_method,
                                status='failed',
                                receipt_code=receipt_code,
                                extra={"failure_reason": pay.get("message")},
                            )
                        except Exception:
                            pass
                        return ShopBuyResponse(success=False, message="결제가 거절되었습니다.", new_balance=getattr(current_user, 'cyber_token_balance', 0) or 0)
                    elif pay.get("status") == "pending":
                        # Record pending and return
                        try:
                            receipt_code = gateway_ref or uuid.uuid4().hex[:12]
                            shop_service.record_transaction(
                                user_id=user_id,
                                product_id=body.product_id,
                                kind='gems',
                                quantity=body.quantity,
                                unit_price=body.amount,
                                amount=body.amount * max(1, body.quantity),
                                payment_method=body.payment_method,
                                status='pending',
                                receipt_code=receipt_code,
                                extra={"note": "gateway pending"},
                            )
                        except Exception:
                            pass
                        return ShopBuyResponse(success=False, message="결제 대기중입니다. 잠시 후 다시 확인해주세요.", new_balance=getattr(current_user, 'cyber_token_balance', 0) or 0)
                except Exception:
                    # If gateway fails unexpectedly, treat as failure
                    return ShopBuyResponse(success=False, message="결제 처리 중 오류가 발생했습니다.", new_balance=getattr(current_user, 'cyber_token_balance', 0) or 0)

            # 토큰 잔액을 충전하고 로그 기록 (결제 성공 케이스)
            from ..services.token_service import TokenService
            token_svc = TokenService(db)
            total_amount = body.amount * max(1, body.quantity)
            new_balance = token_svc.add_tokens(user_id, total_amount)

            # UserAction 기록
            action_payload = {
                "product_id": body.product_id,
                "amount": total_amount,
                "quantity": body.quantity,
                "payment_method": body.payment_method,
                "description": body.description,
                "kind": body.kind,
            }
            ua = models.UserAction(
                user_id=user_id,
                action_type='PURCHASE_GEMS',
                action_data=json.dumps(action_payload, ensure_ascii=False),
            )
            db.add(ua)
            db.commit()

            # Record transaction (best-effort)
            try:
                receipt_code = (gateway_ref or uuid.uuid4().hex[:12])
                shop_service.record_transaction(
                    user_id=user_id,
                    product_id=body.product_id,
                    kind='gems',
                    quantity=body.quantity,
                    unit_price=body.amount,
                    amount=total_amount,
                    payment_method=body.payment_method,
                    status='success',
                    receipt_code=receipt_code,
                    extra={"description": body.description} if body.description else None,
                )
            except Exception:
                pass

            return ShopBuyResponse(
                success=True,
                message="프리미엄 잼 구매(충전) 완료",
                new_balance=new_balance,
                granted_gems=total_amount,
            )

        # item: 아이템 구매 - ShopService 통해 토큰 차감 및 보상 지급
        item_name = body.item_name or body.product_id
        # Prefer server-side computed price when catalog exists
        try:
            price_info = shop_service.compute_price(body.product_id)
            unit_price = int(price_info["final_price"])
        except Exception:
            unit_price = body.amount
        price = unit_price * max(1, body.quantity)
        # 아이템 구매는 외부 결제 없이 토큰 차감만 수행. 필요 시 결제 통합 가능.
        result = shop_service.purchase_item(
            user_id=user_id,
            item_id=0,
            item_name=item_name,
            price=price,
            description=body.description,
            product_id=body.product_id,
        )

        if not result["success"]:
            return ShopBuyResponse(
                success=False,
                message=result["message"],
                new_balance=result["new_balance"],
                item_id=body.product_id,
                item_name=item_name,
                new_item_count=0,
            )

        # Record transaction (best-effort)
        try:
            receipt_code = uuid.uuid4().hex[:12]
            shop_service.record_transaction(
                user_id=user_id,
                product_id=body.product_id,
                kind='item',
                quantity=body.quantity,
                unit_price=unit_price,
                amount=price,
                payment_method=body.payment_method,
                status='success',
                receipt_code=receipt_code,
                extra={"item_name": item_name, "description": body.description} if (item_name or body.description) else None,
            )
        except Exception:
            pass

        return ShopBuyResponse(
            success=True,
            message=result["message"],
            new_balance=result["new_balance"],
            item_id=result.get("item_id", body.product_id),
            item_name=item_name,
            new_item_count=result["new_item_count"],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
