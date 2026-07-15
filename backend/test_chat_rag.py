import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt
from datetime import datetime, timedelta
import httpx

# Settings
MONGODB_URL = "mongodb+srv://Sravanthi634:Sravanthi@cluster0.d9pyvsc.mongodb.net/?appName=Cluster0"
JWT_SECRET = "44efb3c8f87a8bdfa7322e7d7008cfcfda5e656d2db9697193b2a3faef96c641"
JWT_ALGORITHM = "HS256"
API_URL = "http://127.0.0.1:5001/api"

async def main():
    # 1. Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client["video_synopsis_ai"]
    
    # 2. Get a user
    user = await db["users"].find_one()
    if not user:
        print("No users found in database.")
        return
    user_id = str(user["_id"])
    print(f"Using user: {user.get('email')} ({user_id})")
    
    # 3. Get a synopsis owned by this user
    synopsis = await db["synopses"].find_one({"user_id": user_id})
    if not synopsis:
        # Fallback: get any synopsis and assign ownership for testing
        synopsis = await db["synopses"].find_one()
        if not synopsis:
            print("No synopses found in database. Please generate one first.")
            return
        # Temporarily set ownership for test
        await db["synopses"].update_one({"_id": synopsis["_id"]}, {"$set": {"user_id": user_id}})
        synopsis = await db["synopses"].find_one({"_id": synopsis["_id"]})
        
    synopsis_id = str(synopsis["_id"])
    print(f"Using synopsis: {synopsis.get('metadata', {}).get('title')} ({synopsis_id})")
    print(f"Transcript length: {len(synopsis.get('transcript', ''))}")
    
    # 4. Generate JWT Token
    expire = datetime.utcnow() + timedelta(minutes=15)
    token_payload = {
        "sub": user_id,
        "exp": expire
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 5. Clear previous test chat messages (optional, let's keep clean)
    await db["chat_messages"].delete_many({"synopsis_id": synopsis_id, "user_id": user_id})
    
    # 6. Call POST /api/synopsis/{id}/chat with an unrelated query (should be blocked)
    print("\n--- Testing unrelated query (expecting block response) ---")
    payload = {
        "message": "who is president of india",
        "history": []
    }
    
    async with httpx.AsyncClient() as http_client:
        r = await http_client.post(f"{API_URL}/synopsis/{synopsis_id}/chat", json=payload, headers=headers, timeout=30.0)
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.json()}")
        
        # 7. Call POST /api/synopsis/{id}/chat with a related query
        print("\n--- Testing related query ---")
        # Let's ask a question related to key concepts or title
        title = synopsis.get('metadata', {}).get('title', 'video')
        payload = {
            "message": f"What is the main topic of the video: {title}?",
            "history": []
        }
        r = await http_client.post(f"{API_URL}/synopsis/{synopsis_id}/chat", json=payload, headers=headers, timeout=30.0)
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.json()}")
        
        # 8. Call GET /api/synopsis/{id}/chat/history
        print("\n--- Testing history GET API ---")
        r = await http_client.get(f"{API_URL}/synopsis/{synopsis_id}/chat/history", headers=headers)
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.json()}")
        
if __name__ == "__main__":
    asyncio.run(main())
