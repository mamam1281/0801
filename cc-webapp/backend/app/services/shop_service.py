from sqlalchemy.orm import Session
from sqlalchemy import inspect
from typing import Dict, Any, List, Optional
from datetime import datetime

from .. import models
from .token_service import TokenService
import json

class ShopService:
    def __init__(self, db: Session, token_service: TokenService | None = None):
        self.db = db
        self.token_service = token_service or TokenService(db)

    # ----- internal helpers -----
    def _table_exists(self, table_name: str) -> bool:
        try:
            insp = inspect(self.db.get_bind())
            return table_name in insp.get_table_names()
        except Exception:
            return False

    # ----- catalog -----
    def list_active_products(self) -> List[Dict[str, Any]]:
        """Return active products or empty list if table absent."""
        if not self._table_exists('shop_products'):
            return []
        rows = (
            self.db.query(models.ShopProduct)
            .filter(models.ShopProduct.is_active == True)  # noqa: E712
            .all()
        )
        return [
            {
                "product_id": r.product_id,
                "name": r.name,
                "description": r.description,
                "price": r.price,
                "extra": getattr(r, 'extra', None),
            }
            for r in rows
        ]

    def _get_product(self, product_id: str) -> Optional[models.ShopProduct]:
        if not self._table_exists('shop_products'):
            return None
        return (
            self.db.query(models.ShopProduct)
            .filter(models.ShopProduct.product_id == product_id)
            .first()
        )

    def _get_active_discounts(self, product_id: str, now: datetime) -> List[models.ShopDiscount]:
        if not self._table_exists('shop_discounts'):
            return []
        q = self.db.query(models.ShopDiscount).filter(
            models.ShopDiscount.product_id == product_id,
            models.ShopDiscount.is_active == True,  # noqa: E712
        )
        # time-window filter if provided
        q = q.filter(
            (models.ShopDiscount.starts_at == None) | (models.ShopDiscount.starts_at <= now)  # noqa: E711
        ).filter(
            (models.ShopDiscount.ends_at == None) | (models.ShopDiscount.ends_at >= now)  # noqa: E711
        )
        return q.all()

    def compute_price(self, product_id: str, now: Optional[datetime] = None) -> Dict[str, Any]:
        """Compute server price using product base price and applicable discounts.

        Returns dict with base_price, final_price, discounts_applied.
        If catalog tables are missing or product not found, raises ValueError.
        """
        now = now or datetime.utcnow()
        product = self._get_product(product_id)
        if not product:
            raise ValueError("상품이 존재하지 않습니다.")
        base = product.price
        final = base
        applied: List[Dict[str, Any]] = []
        for d in self._get_active_discounts(product_id, now):
            if d.discount_type == 'percent':
                cut = int(base * (d.value / 100.0))
                final = max(0, base - cut)
            elif d.discount_type == 'flat':
                final = max(0, base - d.value)
            applied.append({
                "type": d.discount_type,
                "value": d.value,
                "starts_at": d.starts_at.isoformat() if d.starts_at else None,
                "ends_at": d.ends_at.isoformat() if d.ends_at else None,
            })
            # For simplicity, apply first matching discount; extend to stack as needed
            break
        return {"base_price": base, "final_price": final, "discounts_applied": applied}

    def purchase_item(self, user_id: int, item_id: int, item_name: str, price: int, description: str | None, *, product_id: str | None = None) -> Dict[str, Any]:
        """Item purchase using cyber tokens; logs as UserAction and returns counts.

        This method deducts tokens, records a BUY_PACKAGE action with JSON payload,
        and returns the updated token balance and a simple per-product purchase count.
        """
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        current_balance = getattr(user, 'cyber_token_balance', 0) or 0
        if current_balance < price:
            return {
                "success": False,
                "message": "토큰이 부족합니다.",
                "new_balance": current_balance,
                "item_id": product_id or str(item_id),
                "item_name": item_name,
                "new_item_count": 0,
            }

        # Deduct tokens using the service
        new_balance = self.token_service.deduct_tokens(user_id, price)
        if new_balance is None:
            return {
                "success": False,
                "message": "토큰이 부족합니다.",
                "new_balance": current_balance,
                "item_id": product_id or str(item_id),
                "item_name": item_name,
                "new_item_count": 0,
            }

        # Log purchase as UserAction (BUY_PACKAGE)
        payload = {
            "product_id": product_id or str(item_id),
            "item_id": item_id,
            "item_name": item_name,
            "amount": price,
            "description": description,
            "kind": "item",
        }
        ua = models.UserAction(
            user_id=user_id,
            action_type='BUY_PACKAGE',
            action_data=json.dumps(payload, ensure_ascii=False),
        )
        self.db.add(ua)
        self.db.commit()

        # Compute new item count using action logs
        count_query = self.db.query(models.UserAction).filter(
            models.UserAction.user_id == user_id,
            models.UserAction.action_type == 'BUY_PACKAGE',
        )
        # Narrow by product_id when provided
        if product_id:
            count_query = count_query.filter(models.UserAction.action_data.contains(f'"product_id":"{product_id}"'))
        else:
            count_query = count_query.filter(models.UserAction.action_data.contains(f'"item_id": {item_id}'))
        item_count = count_query.count()

        return {
            "success": True,
            "message": f"{item_name} 구매 성공!",
            "new_balance": new_balance,
            "item_id": product_id or str(item_id),
            "item_name": item_name,
            "new_item_count": item_count,
        }

    # ----- transactions/receipts -----
    def record_transaction(self, user_id: int, product_id: str, kind: str, quantity: int, unit_price: int, amount: int, payment_method: str | None, status: str, receipt_code: str, extra: Dict[str, Any] | None = None) -> None:
        if not self._table_exists('shop_transactions'):
            return
        try:
            tx = models.ShopTransaction(
                user_id=user_id,
                product_id=product_id,
                kind=kind,
                quantity=quantity,
                unit_price=unit_price,
                amount=amount,
                payment_method=payment_method,
                status=status,
                receipt_code=receipt_code,
                extra=extra or None,
            )
            self.db.add(tx)
            self.db.commit()
        except Exception:
            self.db.rollback()

    def list_transactions(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        if self._table_exists('shop_transactions'):
            rows = (
                self.db.query(models.ShopTransaction)
                .filter(models.ShopTransaction.user_id == user_id)
                .order_by(models.ShopTransaction.id.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "product_id": r.product_id,
                    "kind": r.kind,
                    "quantity": r.quantity,
                    "unit_price": r.unit_price,
                    "amount": r.amount,
                    "status": r.status,
                    "payment_method": r.payment_method,
                    "receipt_code": r.receipt_code,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]
        # Fallback: derive from UserAction logs
        logs = (
            self.db.query(models.UserAction)
            .filter(models.UserAction.user_id == user_id, models.UserAction.action_type.in_(['PURCHASE_GEMS', 'BUY_PACKAGE']))
            .order_by(models.UserAction.id.desc())
            .limit(limit)
            .all()
        )
        out: List[Dict[str, Any]] = []
        for a in logs:
            try:
                data = json.loads(a.action_data or '{}')
            except Exception:
                data = {}
            out.append({
                "product_id": data.get('product_id'),
                "kind": data.get('kind'),
                "quantity": data.get('quantity', 1),
                "unit_price": data.get('amount'),
                "amount": data.get('amount'),
                "status": "success",
                "payment_method": data.get('payment_method'),
                "receipt_code": None,
                "created_at": None,
            })
        return out
