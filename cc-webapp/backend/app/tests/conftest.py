import pytest
from fastapi.testclient import TestClient

# Ensure DB tables exist for tests
from app.database import Base, engine
import app.models  # noqa: F401 - register all models on Base


try:
    from app.main import app
except Exception as e:
    # Fallback: try alternate import paths if needed
    raise


@pytest.fixture(scope="session", autouse=True)
def _ensure_schema():
    # Recreate schema for test session to ensure latest columns exist
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # Optional teardown: keep data for debugging; drop if needed
    # Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _elevate_admin_user(client: TestClient):
    """Auto-elevate 'admin1' to admin when present to enable admin API tests.

    Runs per-test; safe to call even if user doesn't exist yet.
    """
    try:
        # Try elevating; will 404 until signup happens, which is fine.
        client.post(
            "/api/admin/users/elevate",
            json={"site_id": "admin1"},
        )
    except Exception:
        # Non-fatal in tests
        pass
    yield

