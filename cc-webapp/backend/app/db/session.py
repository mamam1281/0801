def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get a database session.
    This should be used in FastAPI routes to ensure a session is available.
    """
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()