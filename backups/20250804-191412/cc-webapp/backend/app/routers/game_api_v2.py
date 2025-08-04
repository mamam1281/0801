#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Game API V2 Router
================

게임 API 버전 2 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter

# Router 생성
router = APIRouter()

@router.get("/", tags=["Game API V2"])
async def game_api_v2_root():
    """Game API V2 루트 엔드포인트"""
    return {
        "message": "Game API V2",
        "version": "2.0.0",
        "status": "개발 중"
    }
