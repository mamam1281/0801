#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Admin Simple Router
================

관리자 기능 간소화 버전 엔드포인트를 제공합니다.
"""

from fastapi import APIRouter

# Router 생성
router = APIRouter()

@router.get("/", tags=["Admin Simple"])
async def admin_simple_root():
    """Admin Simple 루트 엔드포인트"""
    return {
        "message": "Admin Simple API",
        "version": "1.0.0",
        "status": "간소화된 관리자 기능"
    }
