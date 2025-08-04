#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Casino-Club F2P API Integration Tests
==================================

API 연동 테스트를 위한 종합적인 테스트 스위트
Docker 환경에서 Python 3.11 + pytest 기반으로 실행
"""

import pytest
import requests
import json
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass

# 테스트 설정
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}"  # /api prefix 제거 - 각 엔드포인트에서 직접 지정

@dataclass
class TestConfig:
    base_url: str = BASE_URL
    api_base: str = API_BASE
    timeout: int = 30
    max_retries: int = 3

class APIClient:
    """API 클라이언트 헬퍼 클래스"""
    
    def __init__(self, config: TestConfig):
        self.config = config
        self.session = requests.Session()
        self.auth_token: Optional[str] = None
    
    def request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """기본 HTTP 요청 메서드"""
        url = f"{self.config.api_base}{endpoint}"
        
        # 인증 토큰이 있으면 헤더에 추가
        if self.auth_token:
            headers = kwargs.get('headers', {})
            headers['Authorization'] = f"Bearer {self.auth_token}"
            kwargs['headers'] = headers
        
        return self.session.request(method, url, timeout=self.config.timeout, **kwargs)
    
    def get(self, endpoint: str, **kwargs) -> requests.Response:
        return self.request("GET", endpoint, **kwargs)
    
    def post(self, endpoint: str, **kwargs) -> requests.Response:
        return self.request("POST", endpoint, **kwargs)
    
    def put(self, endpoint: str, **kwargs) -> requests.Response:
        return self.request("PUT", endpoint, **kwargs)
    
    def delete(self, endpoint: str, **kwargs) -> requests.Response:
        return self.request("DELETE", endpoint, **kwargs)

@pytest.fixture(scope="session")
def config():
    """테스트 설정"""
    return TestConfig()

@pytest.fixture(scope="session")
def api_client(config):
    """API 클라이언트"""
    return APIClient(config)

@pytest.fixture(scope="session", autouse=True)
def wait_for_backend():
    """백엔드 서비스 대기"""
    print("\n🚀 백엔드 서비스 연결 대기 중...")
    
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ 백엔드 서비스 연결 성공! (시도 {attempt + 1}/{max_attempts})")
                return True
        except requests.exceptions.RequestException:
            pass
        
        time.sleep(2)
    
    pytest.fail("❌ 백엔드 서비스에 연결할 수 없습니다.")

# =============================================================================
# 기본 서비스 테스트
# =============================================================================

class TestBasicEndpoints:
    """기본 엔드포인트 테스트"""
    
    def test_health_check(self, api_client):
        """헬스 체크 테스트"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["version"] == "1.0.0"
    
    def test_root_endpoint(self, api_client):
        """루트 엔드포인트 테스트"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Casino-Club F2P Backend API"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
    
    def test_api_info_endpoint(self, api_client):
        """API 정보 엔드포인트 테스트"""
        response = api_client.get("/api")
        assert response.status_code == 200

# =============================================================================
# 인증 시스템 테스트
# =============================================================================

class TestAuthentication:
    """인증 시스템 테스트"""
    
    def test_signup_endpoint_exists(self, api_client):
        """회원가입 엔드포인트 존재 확인"""
        # 잘못된 데이터로 POST - 400이나 422 응답 기대 (404가 아닌)
        response = api_client.post("/api/auth/signup", json={})
        assert response.status_code != 404  # 엔드포인트가 존재함을 확인
    
    def test_login_endpoint_exists(self, api_client):
        """로그인 엔드포인트 존재 확인"""
        response = api_client.post("/api/auth/login", json={})
        assert response.status_code != 404
    
    def test_admin_login_endpoint_exists(self, api_client):
        """관리자 로그인 엔드포인트 존재 확인"""
        response = api_client.post("/api/auth/admin/login", json={})
        assert response.status_code != 404

# =============================================================================
# 사용자 관리 테스트
# =============================================================================

class TestUsers:
    """사용자 관리 테스트"""
    
    def test_user_endpoints_exist(self, api_client):
        """사용자 관련 엔드포인트 존재 확인"""
        endpoints = [
            "/api/users/profile",
            "/api/users/stats", 
            "/api/users/balance"
        ]
        
        for endpoint in endpoints:
            response = api_client.get(endpoint)
            # 인증 오류(401)는 OK, 404는 안됨
            assert response.status_code != 404, f"엔드포인트 누락: {endpoint}"

# =============================================================================
# 게임 시스템 테스트
# =============================================================================

class TestGameSystems:
    """게임 시스템 테스트"""
    
    def test_gacha_endpoints_exist(self, api_client):
        """가챠 시스템 엔드포인트 확인"""
        # OpenAPI에서 확인된 실제 경로들
        response1 = api_client.post("/api/gacha/gacha/pull", json={})
        response2 = api_client.get("/api/gacha/gacha/config")
        response3 = api_client.post("/api/games/gacha/pull", json={})
        
        # 404가 아니면 엔드포인트가 존재함 (401, 422 등은 괜찮음)
        assert response1.status_code != 404
        assert response2.status_code != 404
        assert response3.status_code != 404
    
    def test_rps_endpoint_exists(self, api_client):
        """가위바위보 게임 엔드포인트 확인"""
        response = api_client.post("/api/games/rps/play", json={})
        assert response.status_code != 404
    
    def test_quiz_endpoints_exist(self, api_client):
        """퀴즈 시스템 엔드포인트 확인"""
        # OpenAPI에서 확인된 실제 경로들 (1을 임의의 quiz_id로 사용)
        response1 = api_client.get("/quiz/1")
        response2 = api_client.post("/quiz/1/submit", json={})
        
        # 404가 아니면 엔드포인트가 존재함 (401, 422 등은 괜찮음)
        assert response1.status_code != 404
        assert response2.status_code != 404

# =============================================================================
# AI 및 채팅 시스템 테스트
# =============================================================================

class TestInteractiveFeatures:
    """상호작용 기능 테스트"""
    
    def test_ai_recommendations_exist(self, api_client):
        """AI 추천 시스템 엔드포인트 확인"""
        response = api_client.get("/api/ai/recommendations")
        assert response.status_code != 404
    
    def test_chat_endpoints_exist(self, api_client):
        """채팅 시스템 엔드포인트 확인"""
        response = api_client.get("/api/chat/rooms")
        assert response.status_code != 404

# =============================================================================
# 확장 기능 테스트
# =============================================================================

class TestProgressiveExpansion:
    """Progressive Expansion 기능 테스트"""
    
    def test_analytics_endpoints_exist(self, api_client):
        """분석 시스템 엔드포인트 확인"""
        response = api_client.get("/api/analytics/dashboard/summary")
        assert response.status_code != 404
    
    def test_invite_system_exists(self, api_client):
        """초대 시스템 엔드포인트 확인"""
        response = api_client.get("/api/invite/codes")
        assert response.status_code != 404

# =============================================================================
# 중복 제거 확인 테스트
# =============================================================================

class TestNoDuplicates:
    """중복 제거 확인 테스트"""
    
    def test_no_duplicate_prefixes(self, api_client):
        """중복 prefix 확인 - Swagger JSON 검사"""
        response = requests.get(f"{BASE_URL}/openapi.json")
        assert response.status_code == 200
        
        openapi_spec = response.json()
        paths = openapi_spec.get("paths", {})
        
        # 중복 패턴 검사
        duplicate_patterns = []
        for path in paths.keys():
            if "/api/users/api/users" in path:
                duplicate_patterns.append(path)
            elif "/api/admin/api/admin" in path:
                duplicate_patterns.append(path)
            elif "/api/chat/api/chat" in path:
                duplicate_patterns.append(path)
        
        assert len(duplicate_patterns) == 0, f"중복 prefix 발견: {duplicate_patterns}"
    
    def test_unique_tag_names(self, api_client):
        """태그명 중복 확인"""
        response = requests.get(f"{BASE_URL}/openapi.json")
        assert response.status_code == 200
        
        openapi_spec = response.json()
        tags = openapi_spec.get("tags", [])
        tag_names = [tag["name"].lower() for tag in tags]
        
        # 중복 태그 검사
        unique_tags = set(tag_names)
        assert len(tag_names) == len(unique_tags), "태그명이 중복됩니다."

if __name__ == "__main__":
    print("🧪 API 연동 테스트 시작")
    print("실행 방법:")
    print("1. Docker: docker-compose run --rm test")
    print("2. 로컬: pytest test_api_integration.py -v")
