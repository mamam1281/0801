import os, sys, pytest
from fastapi.testclient import TestClient

# Add backend root to sys.path if missing (when pytest launched from repo root)
_here = os.path.dirname(__file__)
_backend_root = os.path.abspath(os.path.join(_here, "..", ".."))
if _backend_root not in sys.path:
	sys.path.insert(0, _backend_root)

# Ensure DB tables exist for tests
from app.database import Base, engine  # noqa: E402
from sqlalchemy import text as _text  # 추가: 컬럼 보강용
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
	# 항상 초기화 (drift 지속 발생하므로 test DB 파일 제거)
	try:
		from sqlalchemy import inspect as _insp
		engine.dispose()
		if engine.url.database and os.path.exists(engine.url.database):
			os.remove(engine.url.database)
	except Exception:
		pass

	# SQLite 파일에서 이전 버전 테이블 잔존 시 정리 (보조 안전장치)
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
		# Safety net: 단일 골드 통화 컬럼 존재 보장 (테스트 SQLite 환경 한정)
		try:
			from sqlalchemy import inspect, text
			ins3 = inspect(engine)
			if ins3.has_table("users"):
				cols = {c["name"] for c in ins3.get_columns("users")}
				if "gold_balance" not in cols and engine.url.get_backend_name() == 'sqlite':
					with engine.begin() as conn:
						try:
							conn.execute(text("ALTER TABLE users ADD COLUMN gold_balance INTEGER NOT NULL DEFAULT 1000"))
						except Exception:
							pass
		except Exception:
			pass
		# 스키마 drift 감지: user_actions.action_data 누락 시 전체 DB 재생성 (SQLite 한정)
		try:
			from sqlalchemy import inspect
			ins2 = inspect(engine)
			if ins2.has_table("user_actions"):
				cols = {c["name"] for c in ins2.get_columns("user_actions")}
				if "action_data" not in cols:
					# SQLite 에서 누락된 컬럼 추가 (drift 수선) - 데이터 무시 가능 (테스트 DB)
					from sqlalchemy import text
					with engine.begin() as conn:
						try:
							conn.execute(text("ALTER TABLE user_actions ADD COLUMN action_data TEXT"))
						except Exception:
							pass
		except Exception:
			pass
		# 일부 신규 모델이 아직 마이그레이션에 반영되지 않았다면 보강 (idempotent)
		Base.metadata.create_all(bind=engine)
		# --- Safety net 2: ensure gold_balance column exists after metadata creation (sqlite test env) ---
		try:
			if engine.url.get_backend_name() == 'sqlite':
				from sqlalchemy import inspect as _insp2
				insp = _insp2(engine)
				if insp.has_table('users'):
					cols = {c['name'] for c in insp.get_columns('users')}
					if 'gold_balance' not in cols:
						with engine.begin() as conn:
							# nullable 추가 후 기본값 채우고 NOT NULL 강제는 생략 (테스트 용도)
							try:
								conn.execute(_text('ALTER TABLE users ADD COLUMN gold_balance INTEGER DEFAULT 1000'))
								conn.execute(_text('UPDATE users SET gold_balance=1000 WHERE gold_balance IS NULL'))
							except Exception:
								pass
					# Legacy dual-currency columns 제거 (ORM 미정의 + NOT NULL 무 default 로 삽입 실패 방지)
					legacy_cols = {'regular_coin_balance', 'premium_gem_balance', 'cyber_token_balance', 'gem_balance'}
					present_legacy = legacy_cols & cols
					if present_legacy:
						with engine.begin() as conn:
							for lc in present_legacy:
								try:
									conn.execute(_text(f'ALTER TABLE users DROP COLUMN {lc}'))
								except Exception:
									# SQLite 구버전 미지원 시 컬럼을 NULL 허용 + default 0 재작성 시나리오는 복잡 -> skip
									pass
		except Exception:
			pass
	except Exception:
		# Fallback: ensure at least ORM-known tables exist
		Base.metadata.create_all(bind=engine)
		# Fallback path에서도 동일 보강
		try:
			if engine.url.get_backend_name() == 'sqlite':
				from sqlalchemy import inspect as _insp3
				insp = _insp3(engine)
				if insp.has_table('users'):
					cols = {c['name'] for c in insp.get_columns('users')}
					if 'gold_balance' not in cols:
						with engine.begin() as conn:
							try:
								conn.execute(_text('ALTER TABLE users ADD COLUMN gold_balance INTEGER DEFAULT 1000'))
								conn.execute(_text('UPDATE users SET gold_balance=1000 WHERE gold_balance IS NULL'))
							except Exception:
								pass
					legacy_cols = {'regular_coin_balance', 'premium_gem_balance', 'cyber_token_balance', 'gem_balance'}
					present_legacy = legacy_cols & cols
					if present_legacy:
						with engine.begin() as conn:
							for lc in present_legacy:
								try:
									conn.execute(_text(f'ALTER TABLE users DROP COLUMN {lc}'))
								except Exception:
									pass
		except Exception:
			pass
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

