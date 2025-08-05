from sqlalchemy.orm import Session
from typing import Generator

from .base import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    데이터베이스 세션을 제공하는 의존성 함수.
    FastAPI 엔드포인트에서 DB 세션을 주입받기 위해 사용됩니다.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
