from pydantic import BaseModel
from app.schemas.user import UserResponse

class TokenPayload(BaseModel):
    sub: str = None
    role: str = None

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
