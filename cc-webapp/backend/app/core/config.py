import os
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application Settings"""
    # Basic API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Casino-Club F2P Backend"

    # Database Settings
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "cc_postgres")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "cc_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "cc_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "cc_webapp")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    SQLALCHEMY_DATABASE_URI: str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

    # Redis Settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "cc_redis")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))

    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret_key_for_development_only")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # App Settings
    DEBUG: bool = os.getenv("DEBUG", "0") == "1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Kafka Settings
    # Prefer uppercase attribute for clarity, keep lowercase alias for backward-compat
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", os.getenv("KAFKA_BROKER", ""))
    KAFKA_ENABLED: bool = os.getenv("KAFKA_ENABLED", "0") == "1"
    # Comma-separated topics for background consumer; default to cc_test
    KAFKA_TOPICS: str = os.getenv("KAFKA_TOPICS", "cc_test")
    KAFKA_CONSUMER_GROUP: str = os.getenv("KAFKA_CONSUMER_GROUP", "cc_backend_group")
    # Back-compat alias used in some modules
    kafka_bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS

    # Game Settings
    DAILY_SLOT_SPINS: int = 30
    DAILY_CRASH_PLAYS: int = 15
    DAILY_RPS_PLAYS: int = 3
    DAILY_GACHA_PULLS: int = 3

    # VIP Settings
    VIP_DAILY_SLOT_SPINS: int = 50
    VIP_DAILY_CRASH_PLAYS: int = 30
    VIP_DAILY_RPS_PLAYS: int = 5
    VIP_DAILY_GACHA_PULLS: int = 5

    # Slot configuration (symbol weights as JSON-like string env or default mapping)
    SLOT_SYMBOL_WEIGHTS: dict = {
        "🍒": 30,
        "🍋": 25,
        "🍊": 20,
        "🍇": 15,
        "💎": 8,
        "7️⃣": 2,
    }

    class Config:
        case_sensitive = True

# Create global settings object
settings = Settings()
