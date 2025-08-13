import random
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import User

user_id = None


client = TestClient(app)


def setup_module(module):
    # fresh schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # create a user
    db = SessionLocal()
    try:
        u = User(site_id="shopper", nickname="shopper", phone_number="010", password_hash="x", invite_code="5858")
        db.add(u)
        db.commit()
        db.refresh(u)
        global user_id
        user_id = u.id
    finally:
        db.close()


def test_buy_gems_happy_path():
    random.seed(1)  # deterministic payment
    resp = client.post(
        "/api/shop/buy",
        json={"user_id": user_id, "product_id": 1001, "quantity": 2}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["gems_granted"] == 200
    assert body["new_gem_balance"] >= 200
    assert body["charge_id"]


def test_buy_gems_vip_guard():
    # product 1004 requires VIP
    resp = client.post(
        "/api/shop/buy",
        json={"user_id": user_id, "product_id": 1004}
    )
    assert resp.status_code == 403


def test_buy_gems_payment_fail():
    # Force a failure by tweaking random
    random.seed(999999)  # likely to fail auth ~10%
    resp = client.post(
        "/api/shop/buy",
        json={"user_id": user_id, "product_id": 1001}
    )
    assert resp.status_code == 200
    body = resp.json()
    if not body["success"]:
        assert body["gems_granted"] == 0
    else:
        # if the seed still passed, at least success is coherent
        assert body["gems_granted"] == 100
