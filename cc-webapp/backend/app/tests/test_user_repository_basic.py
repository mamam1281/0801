from datetime import datetime, timedelta

from app.database import SessionLocal
from app.database import Base, engine
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.models.auth_models import User


def _cleanup(db, user_id):
    u = db.query(User).filter(User.id == user_id).first()
    if u:
        db.delete(u)
        db.commit()


def test_user_repository_crud_roundtrip():
    # Ensure tables exist for the test
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    repo = UserRepository(db)
    try:
        # create
        hashed = AuthService.get_password_hash("pw1234")
        user = repo.create(
            site_id="repo_t_1",
            nickname="repo_user_1",
            phone_number="01011112222",
            password_hash=hashed,
            invite_code="5858",
        )
        assert user is not None

        # read
        fetched = repo.get_by_id(user.id)
        assert fetched and fetched.site_id == "repo_t_1"

        # update
        ok = repo.update_battlepass_level(user.id, 3)
        assert ok is True
        again = repo.get_by_id(user.id)
        assert again.battlepass_level == 3

        # delete
        assert repo.delete(user.id) is True
        assert repo.get_by_id(user.id) is None
    finally:
        # safety cleanup if any
        if 'user' in locals() and getattr(user, 'id', None):
            _cleanup(db, user.id)
        db.close()
        # Optionally drop tables created for isolation (keep simple and fast)
        # Commented out to avoid race with other tests using same metadata
        # Base.metadata.drop_all(bind=engine)
