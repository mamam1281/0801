"""
초대코드 기반 인증 시스템 테스트
RFM 세그먼테이션 유지 + 인증 단순화
"""
import pytest
from fastapi.testclient import TestClient

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

def test_register_success():
    """Test successful user registration"""
    # 테스트 데이터 준비
    # test_user = User(...)
    pass  # 실제 테스트 코드로 채워야 함

from app.main import app
from app.database import get_db
from app.models import Base, User, InviteCode, UserSegment
from app.auth.simple_auth import SimpleAuth

# 테스트용 인메모리 DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app=app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def sample_invite_code(db_session):
    """테스트용 초대코드 생성"""
    invite = InviteCode(code="VIP123", is_used=False)
    db_session.add(invite)
    db_session.commit()
    return invite.code

class TestSimpleAuth:
    """초대코드 기반 인증 테스트"""
    
    def test_generate_invite_code(self):
        """초대코드 생성 테스트"""
        code = SimpleAuth.generate_invite_code()
        assert len(code) == 6
        assert code.isupper()
        assert code.isalnum()
    
    def test_rank_access_check(self):
        """랭크 기반 접근 제어 테스트"""
        # VIP는 모든 등급 접근 가능
        assert SimpleAuth.check_rank_access("VIP", "STANDARD") == True
        assert SimpleAuth.check_rank_access("VIP", "PREMIUM") == True
        assert SimpleAuth.check_rank_access("VIP", "VIP") == True
        
        # PREMIUM은 STANDARD와 본인 등급 접근 가능
        assert SimpleAuth.check_rank_access("PREMIUM", "STANDARD") == True
        assert SimpleAuth.check_rank_access("PREMIUM", "PREMIUM") == True
        assert SimpleAuth.check_rank_access("PREMIUM", "VIP") == False
        
        # STANDARD는 본인 등급만 접근 가능
        assert SimpleAuth.check_rank_access("STANDARD", "STANDARD") == True
        assert SimpleAuth.check_rank_access("STANDARD", "PREMIUM") == False
        assert SimpleAuth.check_rank_access("STANDARD", "VIP") == False
    
    def test_combined_access_check(self):
        """랭크 + RFM 세그먼트 조합 접근 제어 테스트"""
        # VIP + Whale = 최고급 콘텐츠 접근 가능
        assert SimpleAuth.check_combined_access("VIP", 3, "VIP", 3) == True
        assert SimpleAuth.check_combined_access("VIP", 3, "PREMIUM", 2) == True
        
        # PREMIUM + Medium = 중간급 콘텐츠만 접근
        assert SimpleAuth.check_combined_access("PREMIUM", 2, "PREMIUM", 2) == True
        assert SimpleAuth.check_combined_access("PREMIUM", 2, "VIP", 3) == False  # 랭크 부족
        assert SimpleAuth.check_combined_access("PREMIUM", 1, "PREMIUM", 2) == False  # 세그먼트 부족
        
        # STANDARD + Low = 기본 콘텐츠만 접근
        assert SimpleAuth.check_combined_access("STANDARD", 1, "STANDARD", 1) == True
        assert SimpleAuth.check_combined_access("STANDARD", 1, "PREMIUM", 1) == False

class TestAuthAPI:
    """초대코드 기반 인증 API 테스트"""
    
    def test_register_success(self, client, sample_invite_code):
        """정상 가입 테스트"""
        response = client.post(
            "/api/auth/register",
            json={
                "invite_code": sample_invite_code,
                "nickname": "테스트유저",
                "site_id": "testuser123",
                "phone_number": "010-1234-5678",
                "password": "testpass"
            }
        )
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert data["nickname"] == "테스트유저"
        assert data["rank"] == "STANDARD"
        assert data["cyber_token_balance"] == 200
    
    def test_register_invalid_invite_code(self, client):
        """잘못된 초대코드로 가입 테스트"""
        response = client.post(
            "/api/auth/register",            json={
                "invite_code": "WRONG1",
                "nickname": "테스트유저",
                "site_id": "wronguser",
                "phone_number": "010-5555-6666",
                "password": "testpass123"
            }
        )
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        assert response.status_code == 400
        assert "잘못된 초대코드" in response.json()["detail"]
    
    def test_register_duplicate_nickname(self, client, sample_invite_code, db_session):
        """중복 닉네임 가입 테스트"""
        # 첫 번째 사용자 등록
        user = User(
            site_id="test_site_duplicate",
            nickname="중복닉네임",
            phone_number="010-1234-5678",
            password_hash="hashed_password",
            invite_code=sample_invite_code,
            rank="STANDARD"
        )
        db_session.add(user)
        db_session.commit()
          # 새로운 초대코드 생성
        new_invite = InviteCode(code="TEST01", is_used=False)
        db_session.add(new_invite)
        db_session.commit()
        
        # 중복 닉네임으로 가입 시도
        response = client.post(
            "/api/auth/register", 
            json={
                "invite_code": "TEST01",
                "nickname": "중복닉네임",
                "site_id": "dupuser",
                "phone_number": "010-7777-8888",
                "password": "testpass123"
            }
        )
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        assert response.status_code == 400
        assert "이미 사용중인 닉네임" in response.json()["detail"]
    
    def test_create_invite_codes(self, client):
        """초대코드 생성 테스트"""
        response = client.post(
            "/api/auth/invite-codes",
            json={"count": 3}
        )
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(len(code["code"]) == 6 for code in data)
        assert all(not code["is_used"] for code in data)
    
    def test_get_user_by_nickname(self, client, db_session):
        """닉네임으로 사용자 조회 테스트"""        # 사용자와 세그먼트 생성
        user = User(
            site_id="test_site_lookup",
            nickname="조회테스트",
            phone_number="010-9999-9999",
            password_hash="hashed_password",
            invite_code="VIP123",
            rank="VIP",
            cyber_token_balance=500
        )
        db_session.add(user)
        db_session.flush()
        
        # RFM 세그먼트 추가
        segment = UserSegment(
            user_id=user.id,
            rfm_group="Whale",
            risk_profile="Low",
            name="VIP Whale"
        )
        db_session.add(segment)
        db_session.commit()
        
        response = client.get("/api/auth/users/조회테스트")
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert data["nickname"] == "조회테스트"
        assert data["rank"] == "VIP"
        assert data["cyber_token_balance"] == 500

class TestRFMSegmentation:
    """RFM 세그먼테이션 유지 테스트"""
    
    def test_user_segment_relationship(self, db_session):
        """User-UserSegment 관계 테스트"""
        # 사용자 생성
        user = User(
            site_id="test_site_segment",
            nickname="세그먼트테스트",
            phone_number="010-8888-8888",
            password_hash="hashed_password",
            invite_code="TEST01",
            rank="STANDARD"
        )
        db_session.add(user)
        db_session.flush()
        
        # 세그먼트 생성
        segment = UserSegment(
            user_id=user.id,
            rfm_group="Medium",
            risk_profile="Medium",
            name="Growing User"
        )
        db_session.add(segment)
        db_session.commit()
        
        # 관계 확인
        db_session.refresh(user)
        assert user.segment is not None
        assert user.segment.rfm_group == "Medium"
        assert user.segment.risk_profile == "Medium"
    
    def test_segment_levels(self):
        """세그먼트 레벨 매핑 테스트"""
        segment_levels = {
            "Low": 1,
            "Medium": 2,
            "Whale": 3
        }
        
        # 다양한 세그먼트 레벨 테스트
        assert segment_levels["Low"] < segment_levels["Medium"]
        assert segment_levels["Medium"] < segment_levels["Whale"]
