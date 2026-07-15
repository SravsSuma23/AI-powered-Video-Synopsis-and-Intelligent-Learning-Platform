from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from bson import ObjectId
from app.core.config import settings
from app.database.mongodb import get_database
from app.schemas.token import TokenPayload

# OAuth2PasswordBearer expects a standard tokenUrl. We use this to extract the Authorization header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_database)) -> dict:
    """
    Validate the JWT token from the Authorization header and return the current user dict from MongoDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        token_data = TokenPayload(**payload)
        
        if token_data.sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Query the user from MongoDB
    user = await db[settings.USERS_COLLECTION].find_one({"_id": ObjectId(token_data.sub)})
    
    if user is None:
        raise credentials_exception
        
    # Map MongoDB fields to the expected format
    user["id"] = str(user["_id"])
    user["createdAt"] = user["created_at"]
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Verify if the current authenticated user has an 'admin' role.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
