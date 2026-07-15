import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.routes import auth, synopsis, admin, quiz, assessment

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    try:
        db = get_database()
        user_col = db[settings.USERS_COLLECTION]
        
        # Standardize existing user roles to lowercase
        await user_col.update_many({"role": "Admin"}, {"$set": {"role": "admin"}})
        await user_col.update_many({"role": "User"}, {"$set": {"role": "user"}})
        await user_col.update_many({"role": {"$exists": False}}, {"$set": {"role": "user"}})
        
        # Automatically promote the owner account to admin if it exists
        admin_email = "sravssravanthi634@gmail.com"
        owner_user = await user_col.find_one({"email": admin_email})
        if owner_user:
            if owner_user.get("role") != "admin":
                logger.info(f"Promoting owner account '{admin_email}' to 'admin' role...")
                await user_col.update_one({"email": admin_email}, {"$set": {"role": "admin"}})
        else:
            logger.info(f"Owner account '{admin_email}' is not yet registered. It will automatically get the 'admin' role upon sign-up.")
    except Exception as e:
        logger.error(f"Failed to run database migrations during startup lifespan: {e}")
    yield
    await close_mongo_connection()

def create_app() -> FastAPI:
    """
    Initialize and configure the FastAPI application.
    """
    app = FastAPI(
        title="Video Synopsis AI Backend API",
        description="Enterprise-level backend architecture for Symbiosys Technologies.",
        version="1.0.0",
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
        docs_url="/docs",       # Swagger UI
        redoc_url="/redoc",     # ReDoc
        lifespan=lifespan
    )

    # Configure CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,  # Allows localhost:5173
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API Routers
    app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
    app.include_router(synopsis.router, prefix=f"{settings.API_PREFIX}/synopsis", tags=["Synopsis Processing"])
    app.include_router(admin.router, prefix=f"{settings.API_PREFIX}/admin", tags=["Administration"])
    app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
    app.include_router(assessment.router, prefix="/api/assessment", tags=["assessment"])


    # Register Custom Exception Handlers
    from fastapi.exceptions import RequestValidationError
    from pymongo.errors import PyMongoError
    from app.middleware.error_handler import (
        custom_exception_handler,
        validation_exception_handler,
        database_exception_handler
    )
    
    app.add_exception_handler(Exception, custom_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(PyMongoError, database_exception_handler)

    # Health Check API Endpoint
    @app.get(f"{settings.API_PREFIX}/health", tags=["Health"])
    async def health_check(db = Depends(get_database)):
        """
        Check if the API and database are running and accessible.
        """
        try:
            # Simple ping to db
            await db.client.admin.command('ping')
            db_status = "connected"
        except Exception as e:
            logger.error(f"Health check failed to ping DB: {e}")
            db_status = "disconnected"

        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "database": db_status
        }

    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=(settings.ENVIRONMENT == "development"))
