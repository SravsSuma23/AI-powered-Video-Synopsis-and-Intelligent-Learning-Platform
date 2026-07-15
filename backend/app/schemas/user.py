from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(..., example="John Doe")
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=6, example="password123")
    role: Optional[str] = Field(default="user", example="user")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., example="password123")

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    createdAt: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "603d2e5b8f1b2c3d4e5f6a7b",
                "name": "John Doe",
                "email": "user@example.com",
                "role": "User",
                "createdAt": "2026-05-19T11:26:28Z"
            }
        }
    }

class UserProfileUpdate(BaseModel):
    name: str = Field(..., min_length=1, example="John Doe Updated")
    email: EmailStr = Field(..., example="user@example.com")

class UserPasswordUpdate(BaseModel):
    currentPassword: str = Field(..., example="password123")
    newPassword: str = Field(..., min_length=6, example="newpassword123")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")

