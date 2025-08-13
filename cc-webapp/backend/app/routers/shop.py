from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import json

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


@router.post("/buy", response_model=ShopBuyResponse, summary="Buy gems or item", description="프리미엄 잼 충전 또는 아이템 구매 처리")
def buy(
    body: ShopBuyRequest,
    shop_service: ShopService = Depends(get_shop_service),
    db = Depends(get_db),
):
    try:
        # gems: 충전(토큰을 프리미엄 잼으로 사용) / item: 아이템 구매(토큰 차감)
        if body.kind == 'gems':
            # 토큰 잔액을 충전하고 로그 기록
            from ..services.token_service import TokenService
            token_svc = TokenService(db)
            new_balance = token_svc.add_tokens(body.user_id, body.amount)

            # UserAction 기록
            action_payload = {
                "product_id": body.product_id,
                "amount": body.amount,
                "quantity": body.quantity,
                "payment_method": body.payment_method,
                "description": body.description,
                "kind": body.kind,
            }
            ua = models.UserAction(
                user_id=body.user_id,
                action_type='PURCHASE_GEMS',
                action_data=json.dumps(action_payload, ensure_ascii=False),
            )
            db.add(ua)
            db.commit()

            return ShopBuyResponse(
                success=True,
                message="프리미엄 잼 구매(충전) 완료",
                new_balance=new_balance,
                granted_gems=body.amount,
            )

        # item: 아이템 구매 - ShopService 통해 토큰 차감 및 보상 지급
        item_name = body.item_name or body.product_id
        price = body.amount * max(1, body.quantity)
        result = shop_service.purchase_item(
            user_id=body.user_id,
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
