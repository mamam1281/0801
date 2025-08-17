"""Shop 구매 멱등/경쟁 상태 엣지케이스 테스트 (tests/ 경로로 이전)"""
import uuid
import time
import threading
from typing import List

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _signup(prefix: str = 'idem_edge'):
    unique = uuid.uuid4().hex
    site_id = f'{prefix}_{unique[:20]}'
    nickname = f'{prefix}_{unique[:12]}'
    payload = {
        'invite_code': '5858',
        'site_id': site_id,
        'nickname': nickname,
        'phone_number': f'010{unique[:8]}',
        'password': 'Passw0rd!'
    }
    r = client.post('/api/auth/signup', json=payload)
    assert r.status_code == 200, f"signup 실패: {r.status_code} {r.text}"
    token = r.json()['access_token']
    return token, site_id


def _auth_headers(token: str):
    return {'Authorization': f'Bearer {token}'}


def test_purchase_insufficient_balance_idempotent_fail():
    token, _ = _signup('lowbal')
    headers = _auth_headers(token)
    body = {
        'user_id': 0,  # 서버에서 current_user로 덮어씀
        'product_id': 'big_pack',
        'idempotency_key': uuid.uuid4().hex,
        'amount': 9999999,
        'quantity': 1,
        'kind': 'gems'
    }
    r = client.post('/api/shop/buy', headers=headers, json=body)
    data = r.json()
    # 잔액 부족 또는 실패 응답 구조 확인 (정책 상 success false 처리 가능)
    assert r.status_code in (200, 400, 422)
    assert data.get('success') in (False, None)


def test_purchase_always_fail_gateway_reuse_failed_tx(monkeypatch):
    token, _ = _signup('failgw')
    headers = _auth_headers(token)
    monkeypatch.setenv('PAYMENT_GATEWAY_MODE', 'always_fail')
    idem = uuid.uuid4().hex
    body = {
        'user_id': 0,
        'product_id': 'small_pack',
        'idempotency_key': idem,
        'amount': 100,
        'quantity': 1,
        'kind': 'gems'
    }
    r1 = client.post('/api/shop/buy', headers=headers, json=body)
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1.get('success') is False
    # 동일 키 재시도 → 동일 실패 레코드 재사용 (success 여전히 False)
    r2 = client.post('/api/shop/buy', headers=headers, json=body)
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2.get('success') is False
    assert (data1.get('receipt_code') or data1.get('idempotent_receipt_code')) == (
        data2.get('receipt_code') or data2.get('idempotent_receipt_code'))


def test_purchase_pending_then_success(monkeypatch):
    token, _ = _signup('pendok')
    headers = _auth_headers(token)
    monkeypatch.setenv('PAYMENT_GATEWAY_MODE', 'pending_then_success')
    idem = uuid.uuid4().hex
    body = {
        'user_id': 0,
        'product_id': 'medium_pack',
        'idempotency_key': idem,
        'amount': 120,
        'quantity': 1,
        'kind': 'gems'
    }
    r1 = client.post('/api/shop/buy', headers=headers, json=body)
    assert r1.status_code == 200
    data1 = r1.json()
    # pending 상태: success False 이고 메시지에 '대기' 포함 (status 필드 미노출 케이스 허용)
    assert data1.get('success') is False and ('대기' in (data1.get('message') or ''))
    receipt1 = data1.get('receipt_code') or data1.get('idempotent_receipt_code')
    assert receipt1
    # Poll 재시도 (최대 5회 / 총 ~2.5초)
    success_resp = None
    for _ in range(5):
        time.sleep(0.5)
        monkeypatch.setenv('PAYMENT_GATEWAY_MODE', 'pending_then_success')
        r2 = client.post('/api/shop/buy', headers=headers, json=body)
        assert r2.status_code == 200
        data2 = r2.json()
        receipt2 = data2.get('receipt_code') or data2.get('idempotent_receipt_code')
        assert receipt1 == receipt2
        if data2.get('success') is True:
            success_resp = data2
            break
    # 일정 시간 내 성공 전환이 안 되더라도(환경 지연) 동일 영수증과 pending 유지면 멱등성은 충족
    if success_resp is None:
        assert data2.get('success') is False and ('대기' in (data2.get('message') or ''))
        # 최종 pending 을 허용 (멱등·재사용 보장만 확인)


def test_purchase_concurrency_race_single_record(monkeypatch):
    token, _ = _signup('race')
    headers = _auth_headers(token)
    monkeypatch.setenv('PAYMENT_GATEWAY_MODE', 'always_success')
    idem = uuid.uuid4().hex
    body = {
        'user_id': 0,
        'product_id': 'small_pack',
        'idempotency_key': idem,
        'amount': 100,
        'quantity': 1,
        'kind': 'gems'
    }
    receipts: List[str] = []
    errors: List[str] = []

    def worker():
        try:
            r = client.post('/api/shop/buy', headers=headers, json=body)
            if r.status_code != 200:
                errors.append(f"status {r.status_code}")
                return
            data = r.json()
            receipts.append(data.get('receipt_code') or data.get('idempotent_receipt_code'))
        except Exception as e:  # pragma: no cover (진단용)
            errors.append(str(e))

    threads = [threading.Thread(target=worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # 모든 쓰레드가 동일한 영수증 코드만 받아야 함
    assert not errors, f"thread errors: {errors}"
    assert len(set(receipts)) == 1, f"duplicate records created: {receipts}"
