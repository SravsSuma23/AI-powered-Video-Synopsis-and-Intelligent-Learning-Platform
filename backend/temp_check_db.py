import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    url = os.getenv("MONGODB_URL")
    db_name = os.getenv("MONGODB_DB_NAME", "video_synopsis_ai")
    print(f"Connecting to MongoDB database: {db_name}...")
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    # Check users collection
    users_count = await db["users"].count_documents({})
    print(f"Total users in DB: {users_count}")
    
    # Check synopses collection
    syn_count = await db["synopses"].count_documents({})
    print(f"Total synopses in DB: {syn_count}")
    
    if syn_count > 0:
        print("Last 5 synopses:")
        cursor = db["synopses"].find().sort("created_at", -1).limit(5)
        async for doc in cursor:
            print(f"- ID: {doc.get('_id')}, YouTube ID: {doc.get('metadata', {}).get('youtubeId')}, Created At: {doc.get('created_at')}")

if __name__ == "__main__":
    asyncio.run(check())
