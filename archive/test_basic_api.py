# 테스트를 위한 간단한 FastAPI 앱과 테스트
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# 간단한 FastAPI 앱
app = FastAPI(title="Casino-Club F2P Test")

@app.get("/")
def read_root():
    return {"message": "Casino-Club F2P Backend API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "cc-webapp-backend"}

@app.get("/api/test")
def test_endpoint():
    return {"test": "success", "environment": "test"}

# 테스트 클라이언트
client = TestClient(app)

# 테스트 함수들
def test_read_main():
    """루트 엔드포인트 테스트"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Casino-Club F2P" in data["message"]

def test_health_check():
    """헬스체크 엔드포인트 테스트"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "cc-webapp-backend"

def test_api_endpoint():
    """API 테스트 엔드포인트 테스트"""
    response = client.get("/api/test")
    assert response.status_code == 200
    data = response.json()
    assert data["test"] == "success"
    assert data["environment"] == "test"

def test_nonexistent_endpoint():
    """존재하지 않는 엔드포인트 테스트"""
    response = client.get("/nonexistent")
    assert response.status_code == 404

if __name__ == "__main__":
    # 직접 실행 시 서버 시작
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
