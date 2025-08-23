import warnings

# Pydantic v2 및 passlib 관련 잔여 deprecated / crypt 경고 무시 (테스트 출력 청결)
warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    message=r"Pydantic settings.*"
)
warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    message=r"`class Config`.*deprecated"
)
warnings.filterwarnings(
    "ignore",
    category=UserWarning,
    message=r"passlib.handlers.*"
)

# 필요 시 특정 라이브러리 FutureWarning 제거
warnings.filterwarnings("ignore", category=FutureWarning, module=r"passlib")
"""
테스트를 위한 기본 환경설정
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from app.database import get_db
from app.main import app
from fastapi.testclient import TestClient as _OrigTestClient
import httpx
import fastapi.testclient as _ftc
import anyio
import os
from functools import partial

# Set test environment variables
os.environ["TESTING"] = "true"

# CI 최소 모드에서 ci_core 마커 아닌 테스트 스킵
def pytest_collection_modifyitems(config, items):
    if os.environ.get("CI_MINIMAL") == "1":
        selected = []
        deselected = []
        for item in items:
            if item.get_closest_marker("ci_core"):
                selected.append(item)
            else:
                deselected.append(item)
                # app/tests 아래는 항상 제외 (legacy noisy)
                node_path = str(item.fspath)
                if "app/tests" in node_path.replace('\\', '/'):
                    deselected.append(item)
                    continue
        if deselected:
            for d in deselected:
                d.add_marker(pytest.mark.skip(reason="CI_MINIMAL=1 비핵심 테스트 스킵"))

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    """Provide a shared SQLAlchemy engine for tests.
    This satisfies dependencies like db_session that expect a db_engine fixture.
    """
    return engine

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """테스트 데이터베이스 설정"""
    Base.metadata.create_all(bind=engine)
    yield
    # 테스트 후 클린업 (옵션)
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    db = TestingSessionLocal(bind=connection)

    try:
        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()

class _CompatTestClient:
    """
    Sync wrapper around httpx.AsyncClient + ASGITransport using an anyio blocking portal.
    This avoids deprecated fastapi.testclient usage and works with httpx>=0.27.
    """

    # prevent pytest from collecting this class as a test
    __test__ = False

    def __init__(self, fastapi_app, base_url: str = "http://test", headers: dict | None = None):
        self.app = fastapi_app
        self._transport = httpx.ASGITransport(app=fastapi_app)
        self._ac = httpx.AsyncClient(transport=self._transport, base_url=base_url, headers=headers)
        self._portal = None
        self._portal_cm = None  # context manager for portal

    def _ensure_started(self):
        if self._portal is None:
            # start_blocking_portal may act as a context manager depending on anyio version
            self._portal_cm = anyio.from_thread.start_blocking_portal()
            self._portal = self._portal_cm.__enter__()
            self._portal.call(self._ac.__aenter__)

    # context manager
    def __enter__(self):
        self._ensure_started()
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            if self._portal is not None:
                self._portal.call(self._ac.__aexit__, exc_type, exc, tb)
        finally:
            if self._portal_cm is not None:
                self._portal_cm.__exit__(exc_type, exc, tb)
            self._portal = None
            self._portal_cm = None

    # compat surface
    def request(self, method: str, url: str, **kwargs):
        self._ensure_started()
    return self._portal.call(partial(self._ac.request, method, url, **kwargs))

    def get(self, url: str, **kwargs):
        self._ensure_started()
    return self._portal.call(partial(self._ac.get, url, **kwargs))

    def post(self, url: str, **kwargs):
        self._ensure_started()
    return self._portal.call(partial(self._ac.post, url, **kwargs))

    def put(self, url: str, **kwargs):
        self._ensure_started()
    return self._portal.call(partial(self._ac.put, url, **kwargs))

    def patch(self, url: str, **kwargs):
        self._ensure_started()
    return self._portal.call(partial(self._ac.patch, url, **kwargs))

    def delete(self, url: str, **kwargs):
        self._ensure_started()
    return self._portal.call(partial(self._ac.delete, url, **kwargs))

    def close(self):
        # best-effort close when not used as a context manager
        if self._portal is not None:
            try:
                self._portal.call(self._ac.__aexit__, None, None, None)
            except Exception:
                pass
        if self._portal_cm is not None:
            try:
                self._portal_cm.__exit__(None, None, None)
            except Exception:
                pass
        self._portal = None
        self._portal_cm = None

    @property
    def headers(self):
        return self._ac.headers

    @property
    def cookies(self):
        return self._ac.cookies

# Patch module symbol so test files importing TestClient get the compat version
_ftc.TestClient = _CompatTestClient

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with _CompatTestClient(app) as c:
        yield c
    del app.dependency_overrides[get_db]
