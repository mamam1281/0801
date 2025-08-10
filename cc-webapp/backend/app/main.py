#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Casino-Club F2P Backend Main Application
======================================
Core FastAPI application with essential routers and middleware
"""

import os
import logging
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, status
from contextlib import asynccontextmanager
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Core imports
from app.database import get_db
from app.core.logging import setup_logging
from app.middleware.simple_logging import SimpleLoggingMiddleware
# from app.core.exceptions import add_exception_handlers  # Disabled - empty file
# from app.middleware.error_handling import error_handling_middleware  # Disabled
# from app.middleware.logging import LoggingContextMiddleware  # Disabled

# Import core routers only
from app.routers import (
    auth,
    users,  # Re-enabled
    admin,
    actions,
    # gacha,  # 중복 제거: games.router에 포함됨
    rewards,
    shop,
    missions,
    quiz,        # Quiz system enabled
    dashboard,
    # prize_roulette,  # ARCHIVED - 룰렛 기능 제거
    rps,
    notifications,
    doc_titles,  # Phase 1 added
    feedback,    # Phase 2 added
    games,       # 통합된 게임 라우터 (games_direct 내용으로 대체됨)
    # games_direct, # 중복 제거: games.py에 통합됨
    # game_api,    # 중복 제거: games.router에 통합됨
    invite_router,  # Phase 5 added
    analyze,     # Phase 6 added
    # roulette,    # ARCHIVED - 룰렛 기능 제거
    segments,    # Phase 8 added
    tracking,    # Phase 9 added
    unlock,      # Phase 10 added
    chat,        # Chat system added
    ai_router,   # AI recommendation system
    events,      # 추가 - 이벤트/미션 라우터
)
from app.routers import kafka_api
from app.kafka_client import start_consumer, stop_consumer, get_last_messages, is_consumer_ready

# AI recommendation system router separate import (removed duplicate)

# Scheduler setup
class _DummyScheduler:
    running = False
    def shutdown(self, wait: bool = False) -> None:
        """No-op shutdown when scheduler is unavailable."""

try:
    from app.apscheduler_jobs import start_scheduler, scheduler
except Exception:
    def start_scheduler():
        print("Scheduler disabled or APScheduler not installed")
    scheduler = _DummyScheduler()

# Optional monitoring
try:
    from prometheus_fastapi_instrumentator import Instrumentator
except ImportError:
    Instrumentator = None

try:
    import sentry_sdk
except Exception:
    sentry_sdk = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Casino-Club F2P Backend starting up...")
    try:
        setup_logging()
        print("📋 Logging initialized")
    except Exception as e:
        print(f"⚠️ Logging setup failed: {e}")
    start_scheduler()
    # Start Kafka consumer (optional)
    try:
        await start_consumer()
        if os.getenv("KAFKA_ENABLED", "0") == "1":
            print("📡 Kafka consumer started")
    except Exception as e:
        print(f"⚠️ Kafka consumer start failed: {e}")
    print("✅ Backend startup complete")
    try:
        yield
    finally:
        # Shutdown
        print("🛑 Casino-Club F2P Backend shutting down...")
        # Stop Kafka consumer
        try:
            await stop_consumer()
            if os.getenv("KAFKA_ENABLED", "0") == "1":
                print("📡 Kafka consumer stopped")
        except Exception as e:
            print(f"⚠️ Kafka consumer stop failed: {e}")
        if scheduler and scheduler.running:
            scheduler.shutdown(wait=True)
            print("⏱️ Scheduler stopped")
        print("✅ Backend shutdown complete")

# ===== FastAPI App Initialization =====

app = FastAPI(
    title="Casino-Club F2P API",
    description="Backend API for Casino-Club F2P gaming platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ===== Request/Response Models =====

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str

class LoginRequest(BaseModel):
    user_id: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user_id: str
    message: Optional[str] = None

# ===== Middleware Setup =====

# CORS settings (ENV override: CORS_ORIGINS="http://localhost:3000,https://localhost:3000")
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "http://139.180.155.143:3000",
    "https://139.180.155.143:3000",
]
_env_origins = os.getenv("CORS_ORIGINS", "").strip()
origins = (
    [o.strip() for o in _env_origins.split(",") if o.strip()]
    if _env_origins else _default_origins
)

# Error handlers (disabled - files empty)
# add_exception_handlers(app)

# 간단한 API 로깅 미들웨어 추가
app.add_middleware(SimpleLoggingMiddleware)

# Middleware registration (disabled - files missing)
# app.add_middleware(error_handling_middleware)
# app.add_middleware(LoggingContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Core API Router Registration =====

# Authentication & User Management (no prefix - routers have their own)
app.include_router(auth.router, tags=["Authentication"])
app.include_router(users.router)  # 태그 오버라이드 제거 - 이미 users.py에서 "Users" 태그를 지정함
app.include_router(admin.router)  # 태그 오버라이드 제거 - 이미 admin.py에서 "Admin" 태그를 지정함

# Core Game Systems (no prefix - routers have their own)
app.include_router(actions.router, tags=["Game Actions"])
# app.include_router(gacha.router, tags=["Gacha"])  # 중복 제거: games.router에 포함됨
app.include_router(rewards.router, tags=["Rewards"])
app.include_router(shop.router, tags=["Shop"])
app.include_router(missions.router)  # 태그 오버라이드 제거 - 이미 missions.py에서 "Events & Missions" 태그를 지정함

# Interactive Features (no prefix - routers have their own)
app.include_router(quiz.router)  # 태그 오버라이드 제거 - 이미 quiz_router.py에서 "Quiz" 태그를 지정함
app.include_router(chat.router)  # 태그 오버라이드 제거 - 이미 chat_router.py에서 "Chat" 태그를 지정함
app.include_router(ai_router.router, tags=["AI Recommendation"])

# Management & Monitoring (no prefix - routers have their own)
app.include_router(dashboard.router)  # 태그 오버라이드 제거 - 이미 dashboard.py에서 "Dashboard" 태그를 지정함
app.include_router(notifications.router, tags=["Real-time Notifications"])

# Individual Games (removed - consolidated into games.router)
# app.include_router(rps.router, tags=["Rock Paper Scissors"])  # duplicated in games.router

# ===== Progressive Expansion - Additional Features =====

# Phase 1: Documentation & Content (no prefix - routers have their own)
app.include_router(doc_titles.router, tags=["Document Titles"])

# Phase 2: Feedback System (no prefix - routers have their own)  
app.include_router(feedback.router, tags=["Feedback"])

# Phase 3: Game Collection (no prefix - routers have their own) - 통합된 게임 API
app.include_router(games.router, tags=["Game Collection"])

# Phase 4: Unified Game API (no prefix - routers have their own) - 중복 제거
# app.include_router(game_api.router, tags=["Game API"])  # 중복 제거: games.router에 통합됨

# Phase 5: Invite System (no prefix - routers have their own)
app.include_router(invite_router.router)  # 태그 오버라이드 제거 - 이미 invite_router.py에서 "Invite Codes" 태그를 지정함

# Phase 6: Analytics (no prefix - routers have their own)
app.include_router(analyze.router, tags=["Analytics"])

# Phase 8: User Segmentation (no prefix - routers have their own)  
app.include_router(segments.router)  # 태그 오버라이드 제거 - 이미 segments.py에서 "Segments" 태그를 지정함

# Phase 9: User Tracking (no prefix - routers have their own)
app.include_router(tracking.router, tags=["Tracking"])

# Phase 10: Unlock System (no prefix - routers have their own)
app.include_router(unlock.router, tags=["Unlock"])

# 이벤트/미션 라우터 추가
app.include_router(events.router)  # 태그 오버라이드 제거 - 이미 events.py에서 "Events & Missions" 태그를 지정함
app.include_router(kafka_api.router)

print("✅ Core API endpoints registered")
print("✅ Progressive Expansion features registered") 
print("✅ No duplicate API registrations - Clean structure maintained")
print("✅ Using integrated games router with improved JSON responses")

# ===== Core API Endpoints =====

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Casino-Club F2P Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0"
    )

@app.get("/api/kafka/_debug/last", tags=["Kafka"])
async def kafka_last_messages(limit: int = 10):
    """Return last consumed Kafka messages (debug)."""
    return {"items": get_last_messages(limit)}

@app.get("/api/kafka/_debug/ready", tags=["Kafka"])
async def kafka_ready():
    """Return whether the Kafka consumer is initialized and assigned partitions."""
    try:
        ready = bool(is_consumer_ready())
    except Exception:
        ready = False
    return {"ready": ready}

@app.get("/api", tags=["API Info"])
async def api_info():
    """API information endpoint"""
    return {
        "title": "Casino-Club F2P API",
        "version": "1.0.0",
        "description": "Backend API for Casino-Club F2P gaming platform",
        "endpoints": {
            "auth": "/api/auth",
            "users": "/api/users",
            "admin": "/api/admin",
            "games": "/api/actions, /api/gacha, /api/games/*",
            "shop": "/api/shop, /api/rewards",
            "missions": "/api/missions",
            "quiz": "/api/quiz",
            "dashboard": "/api/dashboard",
            "websocket": "/ws"
        }
    }

 

# ===== Error Handlers =====

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"The requested endpoint {request.url.path} was not found",
            "available_endpoints": "/docs"
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

# 테스트 라우터는 제거되었습니다 - main_fixed.py에서 이 부분이 제거됨
# from app.auth.test_endpoints import router as test_router
# app.include_router(test_router)

