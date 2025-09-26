from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import inspect
from typing import Dict, Any, List, Optional
from typing import Literal
from datetime import datetime
import uuid

from .. import models
from .token_service import TokenService
from .payment_gateway import PaymentGatewayService
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
            .filter(models.ShopProduct.deleted_at.is_(None))
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
        base = float(getattr(product, 'price', 0))
        final = base
        applied: List[Dict[str, Any]] = []
        for d in self._get_active_discounts(product_id, now):
            discount_type = getattr(d, 'discount_type', None)
            value = getattr(d, 'value', None)
            starts_at = getattr(d, 'starts_at', None)
            ends_at = getattr(d, 'ends_at', None)
            # value가 None 또는 SQLAlchemy Column이면 int로 변환
            if value is None:
                continue
            # SQLAlchemy Column 타입 처리
            if hasattr(value, 'expression') or 'Column' in str(type(value)):
                value = int(getattr(d, 'value', 0))
            else:
                value = int(value)
            if discount_type == 'percent':
                cut = int(base * (value / 100.0))
                final = max(0, int(base - cut))
            elif discount_type == 'flat':
                final = max(0, int(base - value))
            applied.append({
                "type": discount_type,
                "value": value,
                "starts_at": starts_at.isoformat() if starts_at else None,
                "ends_at": ends_at.isoformat() if ends_at else None,
            })
            # For simplicity, apply first matching discount; extend to stack as needed
            break
        return {"base_price": int(base), "final_price": int(final), "discounts_applied": applied}

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
        uid = user_id
        try:
            # SQLAlchemy Column 방어적 처리
            if hasattr(uid, 'expression') or 'Column' in str(type(uid)):
                uid = int(getattr(user, 'id', 0))
        except Exception:
            uid = int(getattr(user, 'id', 0))
        new_balance = self.token_service.deduct_tokens(uid, price)
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
    def record_transaction(self, user_id: int, product_id: str, kind: str, quantity: int, unit_price: int, amount: int, payment_method: str | None, status: str, receipt_code: str, extra: Dict[str, Any] | None = None, failure_reason: Optional[str] = None, idempotency_key: Optional[str] = None, *, raise_on_conflict: bool = False) -> None:
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
                failure_reason=failure_reason,
                idempotency_key=idempotency_key,
                extra=extra or None,
            )
            self.db.add(tx)
            self.db.commit()
        except Exception as e:  # pragma: no cover - conflict path exercised in race test
            self.db.rollback()
            if raise_on_conflict:
                raise e

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
                    "product_id": str(getattr(r, 'product_id', '')),
                    "kind": str(getattr(r, 'kind', '')),
                    "quantity": int(getattr(r, 'quantity', 1)),
                    "unit_price": int(getattr(r, 'unit_price', 0)),
                    "amount": int(getattr(r, 'amount', 0)),
                    "status": str(getattr(r, 'status', '')),
                    "payment_method": str(getattr(r, 'payment_method', '')),
                    "receipt_code": str(getattr(r, 'receipt_code', '')),
                    "created_at": r.created_at.isoformat() if getattr(r, 'created_at', None) else None,
                }
                for r in rows
            ]
        # Fallback: derive from UserAction logs
        logs = (
            self.db.query(models.UserAction)
            .filter(
                models.UserAction.user_id == user_id,
                models.UserAction.action_type.in_(['PURCHASE_GOLD', 'BUY_PACKAGE'])
            )
            .order_by(models.UserAction.id.desc())
            .limit(limit)
            .all()
        )
        out: List[Dict[str, Any]] = []
        for a in logs:
            try:
                action_data_val = a.action_data
                if hasattr(action_data_val, 'expression') or 'Column' in str(type(action_data_val)):
                    action_data_val = str(getattr(a, 'action_data', '{}'))
                elif isinstance(action_data_val, str):
                    pass
                else:
                    action_data_val = str(action_data_val)
                    json_field = action_data_val
                    if hasattr(json_field, 'expression') or 'Column' in str(type(json_field)):
                        json_field = str(getattr(a, 'action_data', '{}'))
                    data = json.loads(json_field or '{}')
            except Exception:
                data = {}
            out.append({
                "product_id": data.get('product_id'),
                "kind": data.get('kind'),
                "quantity": data.get('quantity', 1),
                "unit_price": data.get('amount'),
                "amount": data.get('amount'),
                "status": data.get('status') or "success",
                "payment_method": data.get('payment_method'),
                "receipt_code": data.get('receipt_code'),
                "created_at": None,
            })
        return out

    # ----- admin helpers -----
    def admin_search_transactions(
        self,
        *,
        user_id: Optional[int] = None,
        product_id: Optional[str] = None,
        status: Optional[str] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        receipt_code: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        if not self._table_exists('shop_transactions'):
            return []
        q = self.db.query(models.ShopTransaction)
        if user_id is not None:
            q = q.filter(models.ShopTransaction.user_id == user_id)
        if product_id is not None:
            q = q.filter(models.ShopTransaction.product_id == product_id)
        if status is not None:
            q = q.filter(models.ShopTransaction.status == status)
        if receipt_code is not None:
            q = q.filter(models.ShopTransaction.receipt_code == receipt_code)
        if start is not None:
            q = q.filter(models.ShopTransaction.created_at >= start)
        if end is not None:
            q = q.filter(models.ShopTransaction.created_at <= end)
        rows = q.order_by(models.ShopTransaction.id.desc()).limit(limit).all()
        result = []
        for r in rows:
            created_at_val = getattr(r, 'created_at', None)
            if hasattr(created_at_val, 'expression') or 'Column' in str(type(created_at_val)):
                created_at_val = None
            result.append({
                "id": int(getattr(r, 'id', 0)),
                "user_id": int(getattr(r, 'user_id', 0)),
                "product_id": str(getattr(r, 'product_id', '')),
                "kind": str(getattr(r, 'kind', '')),
                "quantity": int(getattr(r, 'quantity', 1)),
                "unit_price": int(getattr(r, 'unit_price', 0)),
                "amount": int(getattr(r, 'amount', 0)),
                "status": str(getattr(r, 'status', '')),
                "payment_method": str(getattr(r, 'payment_method', '')),
                "receipt_code": str(getattr(r, 'receipt_code', '')),
                "created_at": created_at_val.isoformat() if created_at_val else None,
            })
        return result

    # ----- limited packages -----
    def list_limited_available(self, now: Optional[datetime] = None) -> List[Dict[str, Any]]:
        now = now or datetime.utcnow()
        if not self._table_exists('shop_limited_packages'):
            return []
        q = self.db.query(models.ShopLimitedPackage).filter(models.ShopLimitedPackage.is_active == True, models.ShopLimitedPackage.emergency_disabled == False)  # noqa: E712
        q = q.filter((models.ShopLimitedPackage.starts_at == None) | (models.ShopLimitedPackage.starts_at <= now))  # noqa: E711
        q = q.filter((models.ShopLimitedPackage.ends_at == None) | (models.ShopLimitedPackage.ends_at >= now))  # noqa: E711
        out: List[Dict[str, Any]] = []
        for p in q.all():
            starts_at_val = getattr(p, 'starts_at', None)
            ends_at_val = getattr(p, 'ends_at', None)
            if hasattr(starts_at_val, 'expression') or 'Column' in str(type(starts_at_val)):
                starts_at_val = None
            if hasattr(ends_at_val, 'expression') or 'Column' in str(type(ends_at_val)):
                ends_at_val = None
            out.append({
                "package_id": p.package_id,
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "stock_remaining": p.stock_remaining,
                "per_user_limit": p.per_user_limit,
                "starts_at": starts_at_val.isoformat() if starts_at_val else None,
                "ends_at": ends_at_val.isoformat() if ends_at_val else None,
                "contents": p.contents,
            })
        return out

    def _get_limited(self, package_id: str) -> Optional[models.ShopLimitedPackage]:
        if not self._table_exists('shop_limited_packages'):
            return None
        return self.db.query(models.ShopLimitedPackage).filter(models.ShopLimitedPackage.package_id == package_id).first()

    def _user_purchases_count(self, user_id: int, package_id: str) -> int:
        if not self._table_exists('shop_transactions'):
            return 0
        return self.db.query(models.ShopTransaction).filter(
            models.ShopTransaction.user_id == user_id,
            models.ShopTransaction.product_id == package_id,
            models.ShopTransaction.kind == 'item',
            models.ShopTransaction.status == 'success',
        ).count()

    def _apply_promo(self, price: int, promo_code: Optional[str], package_id: str, now: Optional[datetime] = None) -> int:
        if not promo_code:
            return price
        now = now or datetime.utcnow()
        if not self._table_exists('shop_promo_codes'):
            return price
        pc = self.db.query(models.ShopPromoCode).filter(models.ShopPromoCode.code == promo_code, models.ShopPromoCode.is_active == True).first()  # noqa: E712
        if not pc:
            return price
        package_id_val = getattr(pc, 'package_id', None)
        if hasattr(package_id_val, 'expression') or 'Column' in str(type(package_id_val)):
            package_id_val = str(package_id_val)
        if package_id_val and package_id_val != package_id:
            return price
        starts_at_val = getattr(pc, 'starts_at', None)
        if hasattr(starts_at_val, 'expression') or 'Column' in str(type(starts_at_val)):
            starts_at_val = None
        if starts_at_val and starts_at_val > now:
            return price
        ends_at_val = getattr(pc, 'ends_at', None)
        if hasattr(ends_at_val, 'expression') or 'Column' in str(type(ends_at_val)):
            ends_at_val = None
        if ends_at_val and ends_at_val < now:
            return price
        max_uses_val = getattr(pc, 'max_uses', None)
        used_count_val = getattr(pc, 'used_count', 0)
        if hasattr(used_count_val, 'expression') or 'Column' in str(type(used_count_val)):
            used_count_val = int(used_count_val)
        if max_uses_val is not None and used_count_val >= max_uses_val:
            return price
        discount_type_val = getattr(pc, 'discount_type', None)
        if hasattr(discount_type_val, 'expression') or 'Column' in str(type(discount_type_val)):
            discount_type_val = str(discount_type_val)
        value_val = getattr(pc, 'value', 0)
        if hasattr(value_val, 'expression') or 'Column' in str(type(value_val)):
            value_val = int(value_val)
        if discount_type_val == 'percent':
            discounted = max(0, int(price * (100 - value_val) / 100))
        else:
            discounted = max(0, price - value_val)
        return discounted

    def purchase_limited(self, user_id: int, package_id: str, promo_code: Optional[str] = None) -> Dict[str, Any]:
        now = datetime.utcnow()
        pkg = self._get_limited(package_id)
        if not pkg or not bool(getattr(pkg, 'is_active', False)) or bool(getattr(pkg, 'emergency_disabled', False)):
            return {"success": False, "message": "Package unavailable"}
        starts_at = getattr(pkg, 'starts_at', None)
        ends_at = getattr(pkg, 'ends_at', None)
        stock_remaining = int(getattr(pkg, 'stock_remaining', 0)) if getattr(pkg, 'stock_remaining', None) is not None else None
        per_user_limit = int(getattr(pkg, 'per_user_limit', 0)) if getattr(pkg, 'per_user_limit', None) is not None else None
        price = int(getattr(pkg, 'price', 0))        
        if starts_at is not None and now < starts_at:
            return {"success": False, "message": "Package not started"}
        if ends_at is not None and now > ends_at:
            return {"success": False, "message": "Package expired"}
        if stock_remaining is not None and stock_remaining <= 0:
            return {"success": False, "message": "Out of stock"}
        if per_user_limit is not None and self._user_purchases_count(user_id, package_id) >= per_user_limit:
            return {"success": False, "message": "Per-user limit reached"}

        # Determine if promo is valid and track usage; if promo provided but not applied, treat as invalid
        promo_applied = False
        if promo_code:
            old_price = price
            new_price = self._apply_promo(price, promo_code, package_id, now)
            promo_applied = new_price < old_price
            if not promo_applied:
                return {"success": False, "message": "Invalid or exhausted promo code"}
            price = new_price

        # deduct tokens
        new_balance = TokenService(self.db).deduct_tokens(user_id, price)
        if new_balance is None:
            return {"success": False, "message": "Insufficient tokens"}

        # Decrement stock
        if stock_remaining is not None:
            setattr(pkg, 'stock_remaining', max(0, stock_remaining - 1))

        # Record transaction
        tx_code = uuid.uuid4().hex[:12]
        t = models.ShopTransaction(
            user_id=user_id,
            product_id=package_id,
            kind='item',
            quantity=1,
            unit_price=price,
            amount=price,
            payment_method='tokens',
            status='success',
            receipt_code=tx_code,
            extra={"limited": True},
        )
        try:
            self.db.add(t)
            # If promo used, increment usage counter (best-effort)
            if promo_applied and self._table_exists('shop_promo_codes'):
                pc = self.db.query(models.ShopPromoCode).filter(models.ShopPromoCode.code == promo_code).first()
                if pc:
                    used_count_val = int(getattr(pc, 'used_count', 0))
                    setattr(pc, 'used_count', used_count_val + 1)
            self.db.commit()
        except Exception:
            self.db.rollback()
            return {"success": False, "message": "Failed to record transaction"}

        # Deliver contents (tokens/items)
        granted = {}
        contents = getattr(pkg, 'contents', None)
        if contents:
            bonus_tokens = (contents or {}).get('bonus_tokens')
            if isinstance(bonus_tokens, int) and bonus_tokens > 0:
                new_balance = TokenService(self.db).add_tokens(user_id, bonus_tokens)
                granted['bonus_tokens'] = bonus_tokens

        return {"success": True, "message": "Limited package purchased", "new_balance": new_balance, "receipt_code": tx_code, "granted": granted}

    # ----- user settlement/polling -----
    def get_tx_by_receipt_for_user(self, user_id: int, receipt_code: str) -> Optional[models.ShopTransaction]:
        if not self._table_exists('shop_transactions'):
            return None
        try:
            # Column 타입 변환
            user_id_val = int(user_id) if not isinstance(user_id, int) and hasattr(user_id, 'expression') else user_id
            receipt_code_val = str(receipt_code) if not isinstance(receipt_code, str) and hasattr(receipt_code, 'expression') else receipt_code
            return (
                self.db.query(models.ShopTransaction)
                .filter(
                    models.ShopTransaction.user_id == user_id_val,
                    models.ShopTransaction.receipt_code == receipt_code_val,
                )
                .first()
            )
        except Exception as e:
            # Handle SQLite schema drift (missing newly added columns) in ephemeral test DBs
            msg = str(e).lower()
            if 'no such column' in msg or 'has no column named' in msg:
                self._repair_shop_tx_table()
            return None
    def _repair_shop_tx_table(self):
        """Attempt to add any missing columns on shop_transactions (SQLite only).

        This is a lenient, test-environment helper so that newly introduced optional
        columns (receipt_signature, integrity_hash, idempotency_key, extra) don't break
        older persisted local DB files when migrations lag behind model definition.
        """
        try:
            bind = None
            try:
                bind = self.db.get_bind()
            except Exception:
                bind = getattr(self.db, 'bind', None)
            if not bind or not hasattr(bind, 'dialect') or getattr(bind.dialect, 'name', None) != 'sqlite':
                return
            from sqlalchemy import text
            conn = self.db.connection()
            cols = set()
            try:
                res = conn.execute(text('PRAGMA table_info(shop_transactions)'))
                for row in res.fetchall():
                    cols.add(row[1])  # second column is name
            except Exception:
                pass
            needed = {
                'failure_reason': "ALTER TABLE shop_transactions ADD COLUMN failure_reason VARCHAR(500)",
                'integrity_hash': "ALTER TABLE shop_transactions ADD COLUMN integrity_hash VARCHAR(64)",
                'original_tx_id': "ALTER TABLE shop_transactions ADD COLUMN original_tx_id INTEGER",
                'receipt_signature': "ALTER TABLE shop_transactions ADD COLUMN receipt_signature VARCHAR(128)",
                'idempotency_key': "ALTER TABLE shop_transactions ADD COLUMN idempotency_key VARCHAR(80)",
                'extra': "ALTER TABLE shop_transactions ADD COLUMN extra JSON",
                'updated_at': "ALTER TABLE shop_transactions ADD COLUMN updated_at DATETIME",
            }
            for col, ddl in needed.items():
                if col not in cols:
                    try:
                        conn.execute(text(ddl))
                    except Exception:
                        pass
        except Exception:
            pass

    def settle_pending_gold_for_user(self, user_id: int, receipt_code: str, gateway: Optional[PaymentGatewayService] = None) -> Dict[str, Any]:
        tx = self.get_tx_by_receipt_for_user(user_id, receipt_code)
        gateway = gateway or PaymentGatewayService()
        if tx is None:
            # Fallback when transactions table is absent: derive from UserAction log
            a = (
                self.db.query(models.UserAction)
                .filter(
                    models.UserAction.user_id == user_id,
                    models.UserAction.action_type == 'PURCHASE_GOLD',
                    models.UserAction.action_data.contains(f'"receipt_code":"{receipt_code}"'),
                )
                .order_by(models.UserAction.id.desc())
                .first()
            )
            if not a:
                return {"success": False, "message": "Transaction not found"}
            try:
                data = json.loads(str(a.action_data) or '{}')
            except Exception:
                data = {}
            # If already settled
            if data.get('status') == 'success':
                return {"success": True, "status": 'success'}
            gw_ref = data.get('gateway_reference') or receipt_code
            res = gateway.check_status(gw_ref)
            status = res.get('status')
            if status == 'pending':
                return {"success": True, "status": 'pending'}
            elif status == 'failed':
                # Write a follow-up log to indicate failure
                payload = {**data, 'status': 'failed'}
                ua = models.UserAction(user_id=user_id, action_type='PURCHASE_GOLD', action_data=json.dumps(payload, ensure_ascii=False))
                try:
                    self.db.add(ua)
                    self.db.commit()
                except Exception:
                    self.db.rollback()
                return {"success": True, "status": 'failed'}
            else:
                # Credit tokens and write success log
                amount = int(data.get('amount') or 0)
                new_balance = TokenService(self.db).add_tokens(user_id, amount)
                payload = {**data, 'status': 'success'}
                ua = models.UserAction(user_id=user_id, action_type='PURCHASE_GOLD', action_data=json.dumps(payload, ensure_ascii=False))
                try:
                    self.db.add(ua)
                    self.db.commit()
                except Exception:
                    self.db.rollback()
                return {"success": True, "status": 'success', "new_balance": new_balance}
        # Normal path: have transaction row
        status_val = str(getattr(tx, 'status', '') or '')
        kind_val = str(getattr(tx, 'kind', '') or '')
        user_id_val = int(getattr(tx, 'user_id', user_id) or user_id)
        amount_val = int(getattr(tx, 'amount', 0) or 0)
        if status_val != 'pending':
            return {"success": True, "status": status_val}
        if kind_val != 'gold':
            return {"success": False, "message": "Only gold transactions can be auto-settled"}
        res = gateway.check_status(receipt_code)
        status = res.get('status')
        if status == 'pending':
            return {"success": True, "status": 'pending'}
        elif status == 'failed':
            setattr(tx, 'status', 'failed')
            setattr(tx, 'failure_reason', 'Gateway declined on poll')
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
            return {"success": True, "status": 'failed'}
        else:
            TokenService(self.db).add_tokens(int(user_id_val), int(amount_val))
            setattr(tx, 'status', 'success')
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                return {"success": False, "message": "Failed to update transaction"}
            new_balance = TokenService(self.db).get_token_balance(int(user_id_val))
            return {"success": True, "status": 'success', "new_balance": new_balance}

    # ----- admin force settle -----
    def admin_force_settle(self, receipt_code: str, outcome: Literal['success', 'failed'] = 'success') -> Dict[str, Any]:
        if not self._table_exists('shop_transactions'):
            return {"success": False, "message": "Transactions table not found"}
        tx = self.db.query(models.ShopTransaction).filter(models.ShopTransaction.receipt_code == receipt_code).first()
        if not tx:
            return {"success": False, "message": "Transaction not found"}
        status_val = str(getattr(tx, 'status', '') or '')
        kind_val = str(getattr(tx, 'kind', '') or '')
        user_id_val = int(getattr(tx, 'user_id', 0) or 0)
        amount_val = int(getattr(tx, 'amount', 0) or 0)
        if status_val != 'pending':
            return {"success": True, "status": status_val}
        if kind_val != 'gold':
            return {"success": False, "message": "Only gold transactions can be force-settled"}

        if outcome == 'failed':
            setattr(tx, 'status', 'failed')
            setattr(tx, 'failure_reason', 'Force failed by admin')
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                return {"success": False, "message": "DB commit failed"}
            return {"success": True, "status": 'failed'}
        else:
            # success: credit and mark success
            TokenService(self.db).add_tokens(int(user_id_val), int(amount_val))
            setattr(tx, 'status', 'success')
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                return {"success": False, "message": "DB commit failed"}
            new_balance = TokenService(self.db).get_token_balance(int(user_id_val))
            return {"success": True, "status": 'success', "new_balance": new_balance}

    # ----- ADMIN MANAGEMENT FUNCTIONS -----
    # 기존 상품을 손대지 않고 관리 기능만 제공
    
    async def get_products_list(
        self, 
        skip: int = 0, 
        limit: int = 50,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        상품 목록 조회 (관리자용)
        """
        from sqlalchemy import and_, or_
        
        if not self._table_exists('shop_products'):
            return [], 0
            
        query = self.db.query(models.ShopProduct)
        
        # 삭제되지 않은 상품만 조회
        query = query.filter(models.ShopProduct.deleted_at.is_(None))
        
        # 검색 조건
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    models.ShopProduct.name.ilike(search_term),
                    models.ShopProduct.description.ilike(search_term),
                    models.ShopProduct.product_id.ilike(search_term)
                )
            )
        
        # 활성 상태 필터
        if is_active is not None:
            query = query.filter(models.ShopProduct.is_active == is_active)
        
        # 전체 개수
        total = query.count()
        
        # 페이징
        products = query.offset(skip).limit(limit).all()
        
        # 응답 변환
        product_responses = [
            {
                "id": product.id,
                "product_id": product.product_id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "is_active": product.is_active,
                "metadata": getattr(product, 'metadata', {}),
                "extra": getattr(product, 'extra', {}),
                "created_at": product.created_at,
                "updated_at": product.updated_at,
                "deleted_at": getattr(product, 'deleted_at', None)
            }
            for product in products
        ]
        
        return product_responses, total
    
    async def get_product_by_id(self, product_id: int) -> Optional[Dict[str, Any]]:
        """
        특정 상품 조회 (관리자용)
        """
        if not self._table_exists('shop_products'):
            return None
        product = (
            self.db.query(models.ShopProduct)
            .filter(models.ShopProduct.id == product_id, models.ShopProduct.deleted_at.is_(None))
            .first()
        )
        if not product:
            return None
        return {
            "id": product.id,
            "product_id": product.product_id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "is_active": product.is_active,
            "metadata": getattr(product, 'metadata', {}),
            "extra": getattr(product, 'extra', {}),
            "created_at": product.created_at,
            "updated_at": product.updated_at,
            "deleted_at": getattr(product, 'deleted_at', None),
        }

    async def create_product(
        self,
        product_data: Dict[str, Any],
        admin_id: int,
    ) -> Dict[str, Any]:
        """
        새 상품 생성 (기존 상품에 영향 없음)
        """
        if not self._table_exists('shop_products'):
            raise Exception("shop_products 테이블이 없습니다.")
        # product_id 중복 확인
        existing = self.db.query(models.ShopProduct).filter(
            models.ShopProduct.product_id == product_data['product_id']
        ).first()
        if existing:
            raise ValueError(f"상품 ID '{product_data['product_id']}'가 이미 존재합니다.")
        db_product = models.ShopProduct(
            product_id=product_data['product_id'],
            name=product_data['name'],
            description=product_data.get('description'),
            price=product_data['price'],
            is_active=product_data.get('is_active', True),
            metadata=product_data.get('metadata', {}),
            extra=product_data.get('extra', {}),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        return {
            "id": db_product.id,
            "product_id": db_product.product_id,
            "name": db_product.name,
            "description": db_product.description,
            "price": db_product.price,
            "is_active": db_product.is_active,
            "metadata": getattr(db_product, 'metadata', {}),
            "extra": getattr(db_product, 'extra', {}),
            "created_at": db_product.created_at,
            "updated_at": db_product.updated_at,
            "deleted_at": getattr(db_product, 'deleted_at', None),
        }
    
    async def update_product(
        self,
        product_id: int,
        product_data: Dict[str, Any],
        admin_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        기존 상품 수정 (기존 9개 상품도 수정 가능)
        """
        from sqlalchemy import and_
        
        if not self._table_exists('shop_products'):
            return None
        product = self.db.query(models.ShopProduct).filter(
            and_(
                models.ShopProduct.id == product_id,
                models.ShopProduct.deleted_at.is_(None)
            )
        ).first()
        if not product:
            return None
        # product_id 중복 확인 (변경하는 경우)
        if 'product_id' in product_data and product_data['product_id'] != product.product_id:
            existing = self.db.query(models.ShopProduct).filter(
                and_(
                    models.ShopProduct.product_id == product_data['product_id'],
                    models.ShopProduct.id != product_id
                )
            ).first()
            if existing:
                raise ValueError(f"상품 ID '{product_data['product_id']}'가 이미 존재합니다.")
        # 업데이트 적용
        for field, value in product_data.items():
            if value is not None and hasattr(product, field):
                setattr(product, field, value)
        setattr(product, 'updated_at', datetime.utcnow())
        self.db.commit()
        self.db.refresh(product)
        return {
            "id": getattr(product, "id", None),
            "product_id": str(getattr(product, "product_id", "")),
            "name": str(getattr(product, "name", "")),
            "description": str(getattr(product, "description", "")),
            "price": float(getattr(product, "price", 0)),
            "is_active": bool(getattr(product, "is_active", False)),
            "metadata": getattr(product, 'metadata', {}),
            "extra": getattr(product, 'extra', {}),
            "created_at": str(getattr(product, "created_at", "")),
            "updated_at": str(getattr(product, "updated_at", "")),
            "deleted_at": getattr(product, 'deleted_at', None)
        }
    
    async def delete_product(self, product_id: int, admin_id: int) -> bool:
        """
        상품 삭제 (소프트 삭제)
        """
        from sqlalchemy import and_
        if not self._table_exists('shop_products'):
            return False
        product = self.db.query(models.ShopProduct).filter(
            and_(
                models.ShopProduct.id == product_id,
                models.ShopProduct.deleted_at.is_(None)
            )
        ).first()
        if not product:
            return False
        # 소프트 삭제
        setattr(product, 'deleted_at', datetime.utcnow())
        setattr(product, 'updated_at', datetime.utcnow())
        self.db.commit()
        return True
    
    async def set_product_active(
        self,
        product_id: int,
        is_active: bool,
        admin_id: int
    ) -> bool:
        """
        상품 활성화/비활성화
        """
        from sqlalchemy import and_
        if not self._table_exists('shop_products'):
            return False
        product = self.db.query(models.ShopProduct).filter(
            and_(
                models.ShopProduct.id == product_id,
                models.ShopProduct.deleted_at.is_(None)
            )
        ).first()
        if not product:
            return False
        setattr(product, 'is_active', bool(is_active))
        setattr(product, 'updated_at', datetime.utcnow())
        self.db.commit()
        return True
    
    async def get_categories(self) -> List[str]:
        """
        상품 카테고리 목록 조회 (metadata에서 category 추출)
        """
        if not self._table_exists('shop_products'):
            return ["기본", "특별", "이벤트", "프리미엄"]
        try:
            from sqlalchemy import text
            result = self.db.execute(
                text("""
                    SELECT DISTINCT 
                        metadata->>'category' as category
                    FROM shop_products 
                    WHERE deleted_at IS NULL 
                        AND metadata->>'category' IS NOT NULL
                        AND metadata->>'category' != ''
                    ORDER BY category
                """)
            ).fetchall()
            categories = [str(row[0]) for row in result if row[0]]
            if not categories:
                categories = ["기본", "특별", "이벤트", "프리미엄"]
            return categories
        except Exception:
            return ["기본", "특별", "이벤트", "프리미엄"]
    
    async def get_shop_stats(self) -> Dict[str, Any]:
        """
        상점 통계 조회
        """
        try:
            total_products = 0
            active_products = 0
            inactive_products = 0
            deleted_products = 0
            if self._table_exists('shop_products'):
                total_products = int(self.db.query(models.ShopProduct).filter(
                    models.ShopProduct.deleted_at.is_(None)
                ).count())
                active_products = int(self.db.query(models.ShopProduct).filter(
                    models.ShopProduct.deleted_at.is_(None),
                    models.ShopProduct.is_active == True
                ).count())
                inactive_products = total_products - active_products
                deleted_products = int(self.db.query(models.ShopProduct).filter(
                    models.ShopProduct.deleted_at.is_not(None)
                ).count())
            total_sales = 0
            total_revenue = 0
            if self._table_exists('shop_transactions'):
                try:
                    from sqlalchemy import text
                    sales_result = self.db.execute(
                        text("""
                            SELECT COUNT(*) as sales_count,
                                   COALESCE(SUM(amount), 0) as total_revenue
                            FROM shop_transactions 
                            WHERE status = 'completed'
                        """)
                    ).fetchone()
                    if sales_result:
                        total_sales = int(sales_result[0] or 0)
                        total_revenue = int(sales_result[1] or 0)
                except Exception:
                    pass
            categories = await self.get_categories()
            return {
                "total_products": total_products,
                "active_products": active_products,
                "inactive_products": inactive_products,
                "deleted_products": deleted_products,
                "total_sales": total_sales,
                "total_revenue": total_revenue,
                "categories": categories
            }
        except Exception:
            return {
                "total_products": 0,
                "active_products": 0,
                "inactive_products": 0,
                "deleted_products": 0,
                "total_sales": 0,
                "total_revenue": 0,
                "categories": ["기본", "특별", "이벤트", "프리미엄"]
            }
    
    async def get_existing_products_info(self, user_id: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """
        기존 9개 상품 정보 조회 (보존 확인용)
        """
        user_id_val = int(getattr(user_id, 'expression', 0)) if hasattr(user_id, 'expression') or 'Column' in str(type(user_id)) else int(user_id)
        if self._table_exists('shop_transactions'):
            rows = (
                self.db.query(models.ShopTransaction)
                .filter(models.ShopTransaction.user_id == user_id_val)
                .order_by(models.ShopTransaction.id.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "product_id": str(getattr(r, 'product_id', '')),
                    "kind": str(getattr(r, 'kind', '')),
                    "quantity": int(getattr(r, 'quantity', 1)),
                    "unit_price": int(getattr(r, 'unit_price', 0)),
                    "amount": int(getattr(r, 'amount', 0)),
                    "status": str(getattr(r, 'status', '')),
                    "payment_method": str(getattr(r, 'payment_method', '')),
                    "receipt_code": str(getattr(r, 'receipt_code', '')),
                    "created_at": r.created_at.isoformat() if getattr(r, 'created_at', None) else None,
                }
                for r in rows
            ]
        # Fallback: derive from UserAction logs
        logs = (
            self.db.query(models.UserAction)
            .filter(
                models.UserAction.user_id == user_id_val,
                models.UserAction.action_type.in_(['PURCHASE_GOLD', 'BUY_PACKAGE'])
            )
            .order_by(models.UserAction.id.desc())
            .limit(limit)
            .all()
        )
        out: List[Dict[str, Any]] = []
        for a in logs:
            action_data_val = a.action_data
            if hasattr(action_data_val, 'expression') or 'Column' in str(type(action_data_val)):
                action_data_val = str(getattr(a, 'action_data', '{}'))
            elif isinstance(action_data_val, str):
                pass
            else:
                action_data_val = str(action_data_val)
            try:
                data = json.loads(action_data_val or '{}')
            except Exception:
                data = {}
            out.append({
                "product_id": str(data.get('product_id', '')),
                "kind": str(data.get('kind', '')),
                "quantity": int(data.get('quantity', 1)),
                "unit_price": int(data.get('amount', 0)),
                "amount": int(data.get('amount', 0)),
                "status": str(data.get('status') or "success"),
                "payment_method": str(data.get('payment_method', '')),
                "receipt_code": str(data.get('receipt_code', '')),
                "created_at": None,
            })
        return out
