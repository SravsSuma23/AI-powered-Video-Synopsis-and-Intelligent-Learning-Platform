import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Load configuration settings from environment variables and .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Server Settings
    HOST: str = Field(default="127.0.0.1")
    PORT: int = Field(default=5000)
    ENVIRONMENT: str = Field(default="development")
    API_PREFIX: str = Field(default="/api")

    # CORS Settings
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173", 
            "http://127.0.0.1:5173",
            "http://[::1]:5173",
            "http://localhost:5174", 
            "http://127.0.0.1:5174",
            "http://[::1]:5174",
            "http://localhost",
            "http://127.0.0.1",
            "http://[::1]",
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5001",
            "http://127.0.0.1:5001"
        ]
    )

    # MongoDB Atlas Settings
    MONGODB_URL: str
    MONGODB_DB_NAME: str = Field(default="video_synopsis_ai")

    # JWT Authentication Settings
    JWT_SECRET: str
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=52560000)  # Default: 100 years

    # MongoDB Collections Names
    USERS_COLLECTION: str = Field(default="users")
    SYNOPSIS_COLLECTION: str = Field(default="synopses")

    # External API Keys
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini")
    YOUTUBE_API_KEY: str
    GEMINI_API_KEY: str = Field(default="")
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile")

# Create singleton instance of Settings
settings = Settings()
