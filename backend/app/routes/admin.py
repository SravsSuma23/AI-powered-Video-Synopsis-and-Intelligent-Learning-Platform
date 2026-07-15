from fastapi import APIRouter, Depends
from app.database.mongodb import get_database
from app.utils.dependencies import get_current_admin
from app.core.config import settings

router = APIRouter()

@router.get("/metrics")
async def get_admin_metrics(
    current_admin: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Returns platform-wide metrics for the admin dashboard.
    Requires Admin privileges.
    """
    # Fetch real counts from MongoDB
    user_count = await db[settings.USERS_COLLECTION].count_documents({})
    synopsis_count = await db[settings.SYNOPSIS_COLLECTION].count_documents({})
    
    # Calculate mock metrics similar to the frontend's expectation for token usage
    return {
        "totalUsers": user_count,
        "activeUsers": max(0, user_count - 1),
        "totalSummaries": synopsis_count,
        "avgProcessingTimeSec": 14.5,
        "tokenConsumption": synopsis_count * 8750,
        "recentErrors": [], # Fallback for now until robust logging is added
        "activityData": [
            {"date": "Today", "count": synopsis_count}
        ]
    }

@router.get("/users")
async def get_all_users(
    current_admin: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    List all users. Admin only.
    """
    cursor = db[settings.USERS_COLLECTION].find({})
    users = []
    async for user in cursor:
        user["id"] = str(user["_id"])
        user.pop("hashed_password", None)
        user.pop("_id", None)
        user["createdAt"] = user["created_at"]
        users.append(user)
    return users

@router.post("/users/{user_id}/toggle-role")
async def toggle_user_role(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Toggle a user's role between 'Admin' and 'User'.
    Admin only.
    """
    from bson import ObjectId
    from fastapi import HTTPException, status
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")
        
    user = await db[settings.USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    new_role = "admin" if user.get("role", "user").lower() == "user" else "user"
    await db[settings.USERS_COLLECTION].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )
    
    # Return all updated users
    cursor = db[settings.USERS_COLLECTION].find({})
    users = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        u.pop("hashed_password", None)
        u.pop("_id", None)
        u["createdAt"] = u["created_at"]
        users.append(u)
    return users

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Permanently delete a user account from MongoDB.
    Admin only.
    """
    from bson import ObjectId
    from fastapi import HTTPException, status
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")
        
    # Prevent self-deletion
    if user_id == current_admin["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot delete their own accounts.")
        
    result = await db[settings.USERS_COLLECTION].delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # Return remaining users
    cursor = db[settings.USERS_COLLECTION].find({})
    users = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        u.pop("hashed_password", None)
        u.pop("_id", None)
        u["createdAt"] = u["created_at"]
        users.append(u)
    return users

