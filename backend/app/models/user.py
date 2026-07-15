from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator

# Define an annotated type to handle MongoDB's ObjectId as a string in Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserDBModel(BaseModel):
    """
    Represents the database structure of a User document stored in MongoDB.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    email: str
    hashed_password: str
    role: str = "user"  # 'admin' | 'user' (as expected by the React frontend)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()},
        "json_schema_extra": {
            "example": {
                "id": "603d2e5b8f1b2c3d4e5f6a7b",
                "name": "John Doe",
                "email": "user@example.com",
                "role": "User",
                "created_at": "2026-05-19T11:26:28Z"
            }
        }
    }
