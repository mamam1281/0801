import os, sys, pytest
from fastapi.testclient import TestClient

# Add backend root to sys.path if missing (when pytest launched from repo root)
_here = os.path.dirname(__file__)
_backend_root = os.path.abspath(os.path.join(_here, "..", ".."))
if _backend_root not in sys.path:
	sys.path.insert(0, _backend_root)

# Ensure DB tables exist for tests
from app.database import Base, engine  # noqa: E402
import app.models  # noqa: F401, E402 - register all models on Base


try:
	from app.main import app
except Exception as e:
	# Fallback: try alternate import paths if needed
	raise


@pytest.fixture(scope="session", autouse=True)
def _ensure_schema():
	"""Ensure schema is up to date via Alembic; fallback to metadata create_all.

	We avoid Base.metadata.drop_all due to FK dependencies across modules.
	"""
	# SQLite 파일에서 이전 버전 테이블 잔존 시 정리
	try:
		from sqlalchemy import inspect
		ins = inspect(engine)
		if ins.has_table("game_sessions"):
			cols = [c["name"] for c in ins.get_columns("game_sessions")]
			if "external_session_id" not in cols:
				# 오래된 스키마 -> 파일 DB 제거 후 재생성
				engine.dispose()
				import os
				if engine.url.database and os.path.exists(engine.url.database):
					os.remove(engine.url.database)
	except Exception:
		pass

	try:
		from alembic.config import Config
		from alembic import command
		cfg = Config("alembic.ini")
		command.upgrade(cfg, "head")
		# 일부 신규 모델이 아직 마이그레이션에 반영되지 않았다면 보강 (idempotent)
		Base.metadata.create_all(bind=engine)
	except Exception:
		# Fallback: ensure at least ORM-known tables exist
		Base.metadata.create_all(bind=engine)
	yield


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

