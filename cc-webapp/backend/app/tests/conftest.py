import os
import random
import string
import pytest
import httpx

BASE = os.getenv("API_BASE_URL", "http://localhost:8000")


@pytest.fixture(scope="session")
def auth_token() -> str:
    # If provided, reuse external token
    external = os.getenv("TEST_USER_TOKEN")
    if external:
        return external

    # Otherwise create a unique user for the session and login
    suffix = "".join(random.choices(string.digits, k=6))
    site = f"pytest_user_{suffix}"
    phone = f"010{suffix}{random.randint(1000,9999)}"
    # signup (ignore if duplicate phone due to flakiness; then fallback to login only)
    httpx.post(
        f"{BASE}/api/auth/signup",
        json={
            "site_id": site,
            "nickname": f"PyTester{suffix}",
            "phone_number": phone,
            "invite_code": "5858",
            "password": "1234",
        },
        timeout=10.0,
    )
    r = httpx.post(f"{BASE}/api/auth/login", json={"site_id": site, "password": "1234"}, timeout=10.0)
    r.raise_for_status()
    return r.json().get("access_token", "")
