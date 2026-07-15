import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDatabase:
    client: AsyncIOMotorClient = None
    db = None

# Singleton instance of the database helper
db_helper = MongoDatabase()

async def connect_to_mongo():
    """
    Establishes a connection to MongoDB Atlas and verifies it via a ping.
    """
    logger.info(f"Connecting to MongoDB Atlas database: '{settings.MONGODB_DB_NAME}'...")
    try:
        db_helper.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db_helper.db = db_helper.client[settings.MONGODB_DB_NAME]
        
        # Verify connection by pinging the admin server
        await db_helper.client.admin.command('ping')
        logger.info("Successfully pinged MongoDB Atlas. Connection established.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB Atlas: {e}")
        raise e

async def close_mongo_connection():
    """
    Closes the MongoDB connection pool.
    """
    if db_helper.client:
        logger.info("Closing connection to MongoDB Atlas...")
        db_helper.client.close()
        db_helper.client = None
        db_helper.db = None
        logger.info("MongoDB Atlas connection pool closed.")

def get_database():
    """
    Dependency or helper to access the initialized motor database instance.
    """
    if db_helper.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_helper.db
