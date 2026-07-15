import logging
from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

async def custom_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler for unhandled server exceptions.
    """
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail
            }
        )
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please contact system support."
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for Pydantic validation errors (returns structured, client-friendly formats).
    """
    logger.warning(f"Validation Error: {exc.errors()}")
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join([str(loc) for loc in error["loc"][1:]]) if len(error["loc"]) > 1 else str(error["loc"][0]),
            "message": error["msg"]
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation failed for the request payload.",
            "errors": errors
        }
    )

async def database_exception_handler(request: Request, exc: PyMongoError):
    """
    Custom handler for MongoDB and motor driver database query faults.
    """
    logger.error(f"Database Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database service is temporarily unavailable. Please retry shortly."
        }
    )
