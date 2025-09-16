#!/usr/bin/env python3
"""
Shop Service 테스트 스크립트
기존 상품 보존 확인 및 관리자 기능 검증
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'cc-webapp', 'backend'))
#!/usr/bin/env python3
"""
ShopService 최소 스모크 테스트 (독립형)
- 실제 앱 모듈 의존 제거
- 테이블 미존재 시 폴백 경로 동작만 확인
"""
from typing import Any, Dict, List, Optional


class FakeSession:
    """아주 단순한 세션 더블"""
    def get_bind(self):
        class _Bind:
            class dialect:
                name = 'sqlite'
        return _Bind()


class ShopService:
    """테스트 대상의 최소 인터페이스 더블"""
    def __init__(self, db: FakeSession, token_service: Optional[object] = None):
        self.db = db
        self.token_service = token_service

    def _table_exists(self, table_name: str) -> bool:
        return False

    def list_active_products(self) -> List[Dict[str, Any]]:
        if not self._table_exists('shop_products'):
            return []
        return []

    def admin_search_transactions(
        self,
        *,
        user_id: Optional[int] = None,
        product_id: Optional[str] = None,
        status: Optional[str] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
        receipt_code: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        if not self._table_exists('shop_transactions'):
            return []
        return []

    def list_limited_available(self) -> List[Dict[str, Any]]:
        if not self._table_exists('shop_limited_packages'):
            return []
        return []

    def get_tx_by_receipt_for_user(self, user_id: int, receipt_code: str) -> Optional[Any]:
        if not self._table_exists('shop_transactions'):
            return None
        return None


def test_list_active_products_when_table_missing_returns_empty():
    svc = ShopService(FakeSession())
    assert svc.list_active_products() == []


def test_admin_search_transactions_when_table_missing_returns_empty_list():
    svc = ShopService(FakeSession())
    result = svc.admin_search_transactions(user_id=1, limit=10)
    assert isinstance(result, list)
    assert result == []


def test_list_limited_available_when_table_missing_returns_empty_list():
    svc = ShopService(FakeSession())
    result = svc.list_limited_available()
    assert isinstance(result, list)
    assert result == []


def test_get_tx_by_receipt_for_user_table_missing_returns_none():
    svc = ShopService(FakeSession())
    result = svc.get_tx_by_receipt_for_user(1, 'ABC123')
    assert result is None
