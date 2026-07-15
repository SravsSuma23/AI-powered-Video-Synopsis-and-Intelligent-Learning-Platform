from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from io import BytesIO
from app.database.mongodb import get_database
from app.schemas.synopsis import SynopsisGenerateRequest, SynopsisChatRequest, SynopsisChatResponse, SynopsisChatHistoryResponse
from app.services.synopsis_service import SynopsisService
from app.utils.dependencies import get_current_user

router = APIRouter()

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_synopsis(
    request: SynopsisGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Generate a new video synopsis based on YouTube URL.
    Requires authentication.
    """
    service = SynopsisService(db)
    return await service.generate_synopsis(current_user["id"], request)

@router.get("/history")
async def get_history(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get all previously processed synopses for the current user.
    """
    service = SynopsisService(db)
    return await service.get_history(current_user["id"])

@router.get("/{synopsis_id}")
async def get_synopsis_by_id(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get a specific synopsis by ID.
    """
    service = SynopsisService(db)
    return await service.get_by_id(current_user["id"], synopsis_id)

@router.delete("/{synopsis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_synopsis(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Delete a specific synopsis from the user's history.
    """
    service = SynopsisService(db)
    await service.delete_synopsis(current_user["id"], synopsis_id)
    return None

@router.post("/{synopsis_id}/save")
async def toggle_save_synopsis(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Toggle the saved/bookmarked state of a synopsis.
    """
    service = SynopsisService(db)
    return await service.toggle_save(current_user["id"], synopsis_id)

@router.get("/export/ppt/{synopsis_id}")
async def export_synopsis_ppt(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Export a synopsis as a modern PPTX presentation.
    """
    service = SynopsisService(db)
    ppt_bytes, filename = await service.export_ppt(current_user["id"], synopsis_id)
    return StreamingResponse(
        BytesIO(ppt_bytes),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/{synopsis_id}/chat", response_model=SynopsisChatResponse)
async def chat_synopsis(
    synopsis_id: str,
    payload: SynopsisChatRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    AI study coach chat assistant explaining video synopsis and content with simple RAG.
    """
    service = SynopsisService(db)
    return await service.chat_synopsis(current_user, synopsis_id, payload.message, payload.history)

@router.get("/{synopsis_id}/chat/history", response_model=SynopsisChatHistoryResponse)
async def get_chat_history(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Retrieve previous study coach chat history for this synopsis.
    """
    service = SynopsisService(db)
    return await service.get_chat_history(current_user, synopsis_id)


