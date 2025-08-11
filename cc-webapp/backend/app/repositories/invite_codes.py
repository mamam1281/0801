from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from ..models.auth_models import InviteCode


class InviteCodeRepository:
    """Repository for invite code validation using existing InviteCode table.

    Behavior:
    - '5858' is always valid and infinite.
    - Other codes: treat as single-use tokens based on is_active and is_used fields.
    """

    def __init__(self, db: Session):
        self.db = db

    def _row(self, code: str):
        return self.db.execute(select(InviteCode).where(InviteCode.code == code)).scalar_one_or_none()

    def validate(self, code: str) -> dict:
        if code == "5858":
            return {"valid": True, "infinite": True}
        rec = self._row(code)
        if rec is None:
            return {"valid": False, "reason": "NOT_FOUND"}
        if not rec.is_active:
            return {"valid": False, "reason": "INACTIVE"}
        if rec.is_used:
            return {"valid": False, "reason": "USED"}
        return {"valid": True, "infinite": False}

    def consume(self, code: str, user_id: int | None = None) -> bool:
        if code == "5858":
            return True
        rec = self.db.execute(select(InviteCode).where(InviteCode.code == code).with_for_update()).scalar_one_or_none()
        if rec is None or not rec.is_active or rec.is_used:
            return False
        rec.is_used = True
        rec.used_at = datetime.utcnow()
        if user_id:
            rec.used_by_user_id = user_id
        self.db.add(rec)
        self.db.commit()
        return True

    # Admin utilities
    def list_codes(self, include_used: bool = True) -> list[InviteCode]:
        q = select(InviteCode)
        if not include_used:
            q = q.where(InviteCode.is_used == False)  # noqa: E712
        return list(self.db.execute(q).scalars().all())

    def seed_many(self, codes: list[str], active: bool = True, overwrite: bool = False) -> int:
        """Seed multiple invite codes.
        - If overwrite=False, skip existing codes.
        - Returns number of codes created or updated.
        """
        count = 0
        for code in codes:
            if code == "5858":
                continue  # do not persist the infinite code
            rec = self._row(code)
            if rec and not overwrite:
                continue
            if not rec:
                rec = InviteCode(code=code, is_used=False, is_active=active)
                self.db.add(rec)
            else:
                rec.is_active = active
                rec.is_used = False if overwrite else rec.is_used
                rec.used_at = None if overwrite else rec.used_at
                rec.used_by_user_id = None if overwrite else rec.used_by_user_id
            count += 1
        self.db.commit()
        return count
