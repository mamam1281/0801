"""
DEPRECATION: app.config shim
---------------------------------
This module re-exports canonical settings from app.core.config to provide
backward compatibility while we standardize all imports to app.core.config.

Target state: import settings from app.core.config
"""

from __future__ import annotations
from typing import Any
import os

from app.core.config import settings as _core_settings


class _Shim:
    """Adapter exposing legacy attributes while delegating to core settings."""

    # Preferred direct access to core settings
    _core = _core_settings

    # Legacy aliases (read-only properties)
    @property
    def database_url(self) -> str:
        # Map to the canonical SQLAlchemy URI
        return getattr(self._core, "SQLALCHEMY_DATABASE_URI", os.getenv("DATABASE_URL", ""))

    @property
    def secret_key(self) -> str:
        return getattr(self._core, "SECRET_KEY", os.getenv("SECRET_KEY", "secret_key_for_development_only"))

    @property
    def jwt_secret_key(self) -> str:
        # Legacy name; map to SECRET_KEY to keep token creation consistent
        return getattr(self._core, "SECRET_KEY", os.getenv("JWT_SECRET_KEY", "secret_key_for_development_only"))

    @property
    def algorithm(self) -> str:
        return getattr(self._core, "JWT_ALGORITHM", "HS256")

    @property
    def jwt_algorithm(self) -> str:
        return getattr(self._core, "JWT_ALGORITHM", "HS256")

    @property
    def jwt_expire_minutes(self) -> int:
        # If not defined in core, fall back to env 30
        return int(os.getenv("JWT_EXPIRE_MINUTES", "30"))

    @property
    def kafka_bootstrap_servers(self) -> str:
        return os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

    @property
    def environment(self) -> str:
        return getattr(self._core, "ENVIRONMENT", os.getenv("ENVIRONMENT", "development"))

    @property
    def debug(self) -> bool:
        return bool(getattr(self._core, "DEBUG", os.getenv("DEBUG", "0") == "1"))

    # Delegate unknown attributes to core settings
    def __getattr__(self, name: str) -> Any:  # pragma: no cover
        return getattr(self._core, name)


# Public instance used by legacy imports: from app.config import settings
settings = _Shim()


def get_settings():
    return settings


def is_development() -> bool:
    return getattr(_core_settings, "ENVIRONMENT", "development") == "development"
