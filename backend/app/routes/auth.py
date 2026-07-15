from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserProfileUpdate, UserPasswordUpdate, ForgotPasswordRequest
from app.schemas.token import AuthResponse
from app.database.mongodb import get_database
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user

router = APIRouter()

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db = Depends(get_database)):
    """
    Register a new user account. Returns user info and JWT authentication token.
    """
    auth_service = AuthService(db)
    return await auth_service.register_user(user_in)

@router.post("/login", response_model=AuthResponse)
async def login(user_in: UserLogin, db = Depends(get_database)):
    """
    Login user with email and password. Returns user info and JWT authentication token.
    """
    auth_service = AuthService(db)
    return await auth_service.login_user(user_in)

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the currently authenticated user's profile info.
    """
    return current_user

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db = Depends(get_database)):
    """
    Simulate forgot password request.
    """
    auth_service = AuthService(db)
    return await auth_service.forgot_password(request.email)

@router.post("/update-profile", response_model=UserResponse)
async def update_profile(
    request: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Update name and email for the current user.
    """
    auth_service = AuthService(db)
    return await auth_service.update_profile(current_user["id"], request.name, request.email)

@router.post("/update-password")
async def update_password(
    request: UserPasswordUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Update password for the current user.
    """
    auth_service = AuthService(db)
    await auth_service.update_password(current_user["id"], request.currentPassword, request.newPassword)
    return {"message": "Password updated successfully."}

@router.post("/logout")
async def logout():
    """
    Client-side JWT logout validation response.
    """
    return {"message": "Logged out successfully."}

