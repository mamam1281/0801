from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.repositories.invite_codes import InviteCodeRepository
from app.models.auth_models import InviteCode
from app.database import SessionLocal


def _session() -> Session:
    return SessionLocal()


def test_validate_5858_is_infinite():
    with _session() as db:
        repo = InviteCodeRepository(db)
        res = repo.validate("5858")
        assert res["valid"] is True and res.get("infinite") is True


def test_repo_validate_and_consume_limits():
    code = "TEST1"
    with _session() as db:
        # upsert a code single-use active
        existing = db.query(InviteCode).filter(InviteCode.code == code).first()
        if existing:
            db.delete(existing)
            db.commit()
        rec = InviteCode(code=code, is_used=False, is_active=True)
        db.add(rec)
        db.commit()
        repo = InviteCodeRepository(db)
        ok = repo.validate(code)
        assert ok["valid"] is True and ok.get("infinite") is False
        assert repo.consume(code) is True
        # second consume should fail due to limit
        assert repo.consume(code) is False


def test_repo_expired_and_inactive():
    with _session() as db:
        # used
        code_u = "USED1"
        existing = db.query(InviteCode).filter(InviteCode.code == code_u).first()
        if existing:
            db.delete(existing)
            db.commit()
        rec_u = InviteCode(code=code_u, is_used=True, is_active=True)
        db.add(rec_u)
        # inactive
        code_i = "INACTIVE1"
        existing2 = db.query(InviteCode).filter(InviteCode.code == code_i).first()
        if existing2:
            db.delete(existing2)
            db.commit()
        rec_i = InviteCode(code=code_i, is_used=False, is_active=False)
        db.add(rec_i)
        db.commit()
        repo = InviteCodeRepository(db)
        assert repo.validate(code_u)["valid"] is False
        assert repo.validate(code_i)["valid"] is False
