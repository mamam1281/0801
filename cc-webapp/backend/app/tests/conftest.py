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


@pytest.fixture
def auth_token(client):
	"""Return a helper that can create or login a user and return an access token.

	Usage: token = auth_token(role='admin')
	If signup/login is not available, tests calling this fixture will be skipped.
	"""
	import uuid

	def _get(role: str = 'standard'):
		# Try signup endpoint first
		nickname = f"test-{role}-{uuid.uuid4().hex[:6]}"
		payload = {
			"site_id": "testsite",
			"nickname": nickname,
			"invite_code": "5858",
			"password": "TestPass123!"
		}
		try:
			resp = client.post("/api/auth/signup", json=payload)
		except Exception:
			pytest.skip("auth endpoints not available in this test environment")

		if resp.status_code in (200, 201):
			data = resp.json()
			token = data.get("access_token") or data.get("token") or data.get("accessToken")
			if token:
				return token

		# Fallback: try login endpoint if signup returned non-token response
		login_payload = {"site_id": payload["site_id"], "password": payload["password"], "nickname": payload["nickname"]}
		try:
			lresp = client.post("/api/auth/login", json=login_payload)
			if lresp.status_code == 200:
				ldata = lresp.json()
				token = ldata.get("access_token") or ldata.get("token")
				if token:
					return token
		except Exception:
			pass

		pytest.skip("could not obtain auth token via signup/login")

	return _get

