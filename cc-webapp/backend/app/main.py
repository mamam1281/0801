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
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Core imports
from app.database import get_db
from app.core.logging import setup_logging
# from app.core.exceptions import add_exception_handlers  # Disabled - empty file
# from app.middleware.error_handling import error_handling_middleware  # Disabled
# from app.middleware.logging import LoggingContextMiddleware  # Disabled

# Import core routers only
from app.routers import (
    auth,
    users,  # Re-enabled
    admin,
    actions,
    gacha,
    rewards,
    shop,
    missions,
    quiz,        # Quiz system enabled
    dashboard,
    prize_roulette,
    rps,
    notifications,
    doc_titles,  # Phase 1 added
    feedback,    # Phase 2 added
    games,       # Phase 3 added
    game_api,    # Phase 4 added
    invite_router,  # Phase 5 added
    analyze,     # Phase 6 added
    roulette,    # Phase 7 added
    segments,    # Phase 8 added
    tracking,    # Phase 9 added
    unlock,      # Phase 10 added
    chat,        # Chat system added
)

# AI recommendation system router separate import
from app.routers import ai_router

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

# ===== FastAPI App Initialization =====

app = FastAPI(
    title="Casino-Club F2P API",
    description="Backend API for Casino-Club F2P gaming platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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

# CORS settings
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "http://139.180.155.143:3000",
    "https://139.180.155.143:3000",
]

# Error handlers (disabled - files empty)
# add_exception_handlers(app)

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

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(actions.router, prefix="/api/actions", tags=["Game Actions"])
app.include_router(gacha.router, prefix="/api/gacha", tags=["Gacha"])
app.include_router(rewards.router, prefix="/api/rewards", tags=["Rewards"])
app.include_router(shop.router, prefix="/api/shop", tags=["Shop"])
app.include_router(missions.router, prefix="/api/missions", tags=["Missions"])
# Newly added major features
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])  # Quiz system
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])  # Chat system
app.include_router(ai_router.router, prefix="/api/ai", tags=["AI Recommendation"])  # AI recommendation

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(prize_roulette.router, prefix="/api/games/roulette", tags=["Prize Roulette"])
app.include_router(rps.router, prefix="/api/games/rps", tags=["Rock Paper Scissors"])
app.include_router(notifications.router, prefix="/ws", tags=["Real-time Notifications"])

# ===== Progressive Expansion - Phase 1 =====
app.include_router(doc_titles.router, prefix="/api/doc-titles", tags=["Document Titles"])

# ===== Progressive Expansion - Phase 2 =====
app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])

# ===== Progressive Expansion - Phase 3 =====
app.include_router(games.router, prefix="/api/games", tags=["Games"])

# ===== Progressive Expansion - Phase 4 =====
app.include_router(game_api.router, prefix="/api/game-api", tags=["Game API"])

# ===== Progressive Expansion - Phase 5 =====
app.include_router(invite_router.router, prefix="/api/invites", tags=["Invite Codes"])

# ===== Progressive Expansion - Phase 6 =====
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analytics"])

# ===== Progressive Expansion - Phase 7 =====
app.include_router(roulette.router, prefix="/api/roulette", tags=["Roulette"])

# ===== Progressive Expansion - Phase 8 =====
app.include_router(segments.router, prefix="/api/segments", tags=["Segments"])

# ===== Progressive Expansion - Phase 9 =====
app.include_router(tracking.router, prefix="/api/tracking", tags=["Tracking"])

# ===== Progressive Expansion - Phase 10 =====
app.include_router(unlock.router, prefix="/api/unlock", tags=["Unlock"])

# ===== New AI & Chat Systems =====
# AI recommendation system
app.include_router(ai_router.router, prefix="/api/ai", tags=["AI Recommendations"])

# Quiz system (extended)
from app.routers import quiz_router
app.include_router(quiz_router.router, prefix="/api/quiz", tags=["Quiz System"])

# Chat system
from app.routers import chat_router
app.include_router(chat_router.router, prefix="/api/chat", tags=["Chat System"])

print("✅ Core API endpoints registered + Progressive Expansion Phase 1-10 Complete")
print("✅ New AI Recommendation, Quiz & Chat Systems registered")

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

# ===== Application Lifecycle Events =====

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    print("🚀 Casino-Club F2P Backend starting up...")
    
    # Initialize logging
    try:
        setup_logging()
        print("📋 Logging initialized")
    except Exception as e:
        print(f"⚠️ Logging setup failed: {e}")
    
    # Start scheduler
    start_scheduler()
    
    # Note: Prometheus monitoring disabled to avoid middleware timing issue
    # if Instrumentator:
    #     Instrumentator().instrument(app).expose(app)
    #     print("📊 Prometheus monitoring enabled")
    
    print("✅ Backend startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    print("🛑 Casino-Club F2P Backend shutting down...")
    
    # Shutdown scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=True)
        print("⏱️ Scheduler stopped")
    
    print("✅ Backend shutdown complete")

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
