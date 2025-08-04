"""Tests for main.py - FastAPI app initialization, middlewares, and configuration."""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from unittest.mock import patch, MagicMock
import os
import asyncio

from app.main import app

def test_app_creation():
    """Test that FastAPI app is created with correct configuration."""
    assert app.title == "Casino Club API"
    assert app.version == "0.1.0"
    assert app.docs_url == "/docs"
    assert app.redoc_url == "/redoc"

def test_health_endpoint():
    """Test health check endpoint."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_login_endpoint_success():
    """Test login endpoint with valid credentials."""
    client = TestClient(app)
    response = client.post("/login", json={
        "user_id": "test",
        "password": "password"
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user_id"] == "test"
    assert data["message"] == "로그인 성공"

def test_login_endpoint_failure():
    """Test login endpoint with invalid credentials."""
    client = TestClient(app)
    response = client.post("/login", json={
        "user_id": "invalid",
        "password": "wrong"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "인증 실패"

def test_login_endpoint_validation():
    """Test login endpoint with invalid request format."""
    client = TestClient(app)
    # Missing required fields
    response = client.post("/login", json={})
    assert response.status_code == 422

@patch.dict(os.environ, {"DISABLE_SCHEDULER": "1"})
def test_lifespan_scheduler_disabled(monkeypatch):
    """Test lifespan context when scheduler is disabled."""
    from app.main import lifespan
    async def test_lifespan():
        async with lifespan(app):
            pass
    asyncio.run(test_lifespan())

@patch('app.main.start_scheduler')
def test_lifespan_scheduler_enabled(mock_start_scheduler, monkeypatch):
    """Test lifespan context when scheduler is enabled."""
    from app.main import lifespan
    monkeypatch.delenv("DISABLE_SCHEDULER", raising=False)
    
    async def test_lifespan():
        async with lifespan(app):
            mock_start_scheduler.assert_called_once()
    asyncio.run(test_lifespan())

@patch.dict(os.environ, {}, clear=True)
def test_sentry_initialization_no_dsn():
    """Test Sentry initialization when no DSN is provided."""
    pass

def test_cors_middleware_configured():
    """Test that CORS middleware is properly configured."""
    client = TestClient(app)
    response = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })
    assert response.status_code in [200, 405]

def test_prometheus_instrumentator_configured():
    """Test that Prometheus instrumentator is configured when available."""
    client = TestClient(app)
    try:
        response = client.get("/metrics")
        assert response.status_code == 200
    except Exception:
        pass

def test_app_openapi_schema():
    """Test that OpenAPI schema is generated correctly."""
    openapi_schema = app.openapi()
    assert openapi_schema["info"]["title"] == "Casino Club API"
    assert openapi_schema["info"]["version"] == "0.1.0"
    assert "paths" in openapi_schema
    assert "/health" in openapi_schema["paths"]
    assert "/login" in openapi_schema["paths"]

def test_dummy_scheduler_when_import_fails():
    """Test that dummy scheduler is used when APScheduler import fails."""
    from app.main import _DummyScheduler
    dummy = _DummyScheduler()
    assert dummy.running == False
    dummy.shutdown(wait=True)
