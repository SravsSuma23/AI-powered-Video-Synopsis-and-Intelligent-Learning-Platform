from fastapi import APIRouter, Depends, status
from app.database.mongodb import get_database
from app.services.quiz_service import QuizService
from app.utils.dependencies import get_current_user
from app.schemas.quiz import QuizSubmitRequestSchema, QuizChatRequestSchema

router = APIRouter()

@router.post("/generate/{synopsis_id}", status_code=status.HTTP_201_CREATED)
async def generate_quiz(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Generate 20 MCQs based on video content. Grabs previous quizzes to avoid duplicates.
    Requires authentication.
    """
    service = QuizService(db)
    return await service.generate_quiz(current_user["id"], synopsis_id)

@router.post("/submit/{quiz_id}")
async def submit_quiz(
    quiz_id: str,
    payload: QuizSubmitRequestSchema,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Submit answers to a quiz session and receive detailed learning analytics.
    """
    service = QuizService(db)
    return await service.submit_quiz(current_user["id"], quiz_id, payload.selected_answers)

@router.get("/attempts/{synopsis_id}")
async def get_quiz_attempts(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get all previous quiz attempts for this synopsis.
    """
    service = QuizService(db)
    return await service.get_attempts(current_user["id"], synopsis_id)

@router.post("/chat")
async def quiz_chat_response(
    payload: QuizChatRequestSchema,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    AI assistant chat explaining quiz questions and concepts.
    """
    service = QuizService(db)
    response_text = await service.quiz_chat(current_user["id"], payload.model_dump(by_alias=True))
    return {"response": response_text}
