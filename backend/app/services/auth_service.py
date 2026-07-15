from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.user import UserCreate, UserLogin
from app.models.user import UserDBModel
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.schemas.token import AuthResponse

class AuthService:
    def __init__(self, db):
        self.collection = db[settings.USERS_COLLECTION]

    async def register_user(self, user_in: UserCreate) -> AuthResponse:
        """
        Register a new user, ensuring the email is unique, and return user details + JWT token.
        """
        # 1. Check if user already exists
        existing_user = await self.collection.find_one({"email": user_in.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists with this email address."
            )

        # Determine role strictly on backend (only owner email gets admin)
        assigned_role = "admin" if user_in.email.lower() == "sravssravanthi634@gmail.com" else "user"

        # 2. Hash password and prepare DB model
        hashed_pw = get_password_hash(user_in.password)
        db_user = UserDBModel(
            name=user_in.name,
            email=user_in.email.lower(),
            hashed_password=hashed_pw,
            role=assigned_role
        )

        # 3. Insert into MongoDB
        user_dict = db_user.model_dump(by_alias=True, exclude={"id"})
        result = await self.collection.insert_one(user_dict)
        
        # 4. Generate JWT Token
        user_id = str(result.inserted_id)
        access_token = create_access_token(subject=user_id, role=db_user.role)

        # 5. Prepare AuthResponse
        user_response_dict = {
            "id": user_id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role,
            "createdAt": db_user.created_at
        }
        
        return AuthResponse(user=user_response_dict, token=access_token)

    async def login_user(self, user_in: UserLogin) -> AuthResponse:
        """
        Authenticate a user via email/password and return user details + JWT token.
        """
        # 1. Check if user exists
        db_user = await self.collection.find_one({"email": user_in.email.lower()})
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        # 2. Verify password
        if not verify_password(user_in.password, db_user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        # 3. Generate JWT Token
        user_id = str(db_user["_id"])
        access_token = create_access_token(subject=user_id, role=db_user.get("role", "user"))

        # 4. Prepare AuthResponse
        user_response_dict = {
            "id": user_id,
            "name": db_user["name"],
            "email": db_user["email"],
            "role": db_user.get("role", "user"),
            "createdAt": db_user["created_at"]
        }
        
        return AuthResponse(user=user_response_dict, token=access_token)

    async def update_profile(self, user_id: str, name: str, email: str) -> dict:
        """
        Updates name and email in MongoDB, ensuring email uniqueness.
        """
        # Validate ID format
        from bson import ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format."
            )

        # Check email uniqueness against other users
        existing_user = await self.collection.find_one({
            "email": email.lower(),
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already in use by another account."
            )

        # Update the user
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"name": name, "email": email.lower()}}
        )

        # Retrieve updated user
        updated_user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        return {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"],
            "role": updated_user.get("role", "user"),
            "createdAt": updated_user["created_at"]
        }

    async def update_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """
        Verifies old password, hashes new password, and saves to MongoDB.
        """
        from bson import ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format."
            )

        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        # Verify old password
        if not verify_password(current_password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )

        # Hash and set new password
        hashed_pw = get_password_hash(new_password)
        await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"hashed_password": hashed_pw}}
        )
        return True

    async def forgot_password(self, email: str) -> dict:
        """
        Validates user exists and returns a simulated password reset message.
        """
        user = await self.collection.find_one({"email": email.lower()})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account registered with this email address."
            )

        return {
            "message": f"Password reset instructions have been simulated and sent to {email}."
        }

