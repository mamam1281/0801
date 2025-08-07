"""단순화된 FastAPI 메인 앱"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .routers import auth_simple
from . import database

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# 앱 생성
app = FastAPI(title="Casino-Club F2P API - 단순 버전")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용으로 모든 출처 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_simple.router)

# 데이터베이스 초기화
database.Base.metadata.create_all(bind=database.engine)

@app.get("/")
def read_root():
    return {"message": "Casino-Club F2P API - 단순 버전이 실행 중입니다"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "시스템이 정상적으로 실행 중입니다"}
