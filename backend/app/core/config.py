##################################################
# IMPORTS
##################################################

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict
)

from functools import lru_cache


##################################################
# APPLICATION SETTINGS
##################################################

class Settings(BaseSettings):
    """
    Centralized Application Configuration
    """

    ##################################################
    # APPLICATION
    ##################################################

    APP_NAME: str = "Enterprise Visitor Management System"
    APP_VERSION: str = "1.0.0"

    ##################################################
    # DATABASE
    ##################################################

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int

    ##################################################
    # JWT
    ##################################################

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ##################################################
    # REDIS
    ##################################################

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    ##################################################
    # EMAIL
    ##################################################

    EMAIL_USER: str | None = None
    EMAIL_PASSWORD: str | None = None
    BACKEND_URL: str | None = None


    ##################################################
    # PYDANTIC SETTINGS
    ##################################################

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


##################################################
# SETTINGS INSTANCE
##################################################

@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()