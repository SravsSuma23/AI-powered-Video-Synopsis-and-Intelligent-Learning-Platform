from fastapi import APIRouter, Depends, status, HTTPException
from app.database.mongodb import get_database
from app.services.assessment_service import AssessmentService
from app.utils.dependencies import get_current_user
from app.schemas.assessment import AssessmentSubmitRequestSchema, ExamSubmitRequestSchema

router = APIRouter()

@router.get("/get/{synopsis_id}")
async def get_assessment(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get the assessment generated for this synopsis.
    If it doesn't exist, it generates and caches it lazily.
    """
    service = AssessmentService(db)
    return await service.generate_assessment(current_user["id"], synopsis_id)

@router.post("/generate/{synopsis_id}", status_code=status.HTTP_201_CREATED)
async def force_generate_assessment(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Forcefully re-generate (or create) the assessment for this synopsis.
    """
    service = AssessmentService(db)
    # Clear existing if any
    await db["assessments"].delete_many({"synopsis_id": synopsis_id})
    return await service.generate_assessment(current_user["id"], synopsis_id)

@router.post("/submit/{assessment_id}")
async def submit_assessment_section(
    assessment_id: str,
    payload: AssessmentSubmitRequestSchema,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Submit answers for a specific section of the assessment and receive grading.
    """
    service = AssessmentService(db)
    return await service.submit_section(
        current_user["id"],
        assessment_id,
        payload.section,
        payload.answers,
        payload.time_taken
    )

@router.get("/attempts/{synopsis_id}")
async def get_assessment_attempts(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get all previous assessment attempts for this synopsis.
    """
    service = AssessmentService(db)
    return await service.get_attempts(current_user["id"], synopsis_id)

@router.get("/performance/{synopsis_id}")
async def get_latest_performance(
    synopsis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Load the latest performance report and personalized study plan.
    Returns null if no attempts exist yet.
    """
    service = AssessmentService(db)
    performance = await service.get_latest_performance(current_user["id"], synopsis_id)
    if not performance:
        return {
            "overallScore": 0.0,
            "maxScore": 0.0,
            "accuracy": 0.0,
            "timeTaken": 0,
            "weakTopics": [],
            "strongTopics": [],
            "feedback": "No attempts recorded yet. Attempt any assessment tab to generate feedback.",
            "recommendedRevisionSections": [],
            "studyPlan": "No plan available yet. Complete at least one assessment section.",
            "extraPracticeQuestions": [],
            "sections": {}
        }
    return performance

@router.post("/exam/submit/{assessment_id}")
async def submit_full_exam(
    assessment_id: str,
    payload: ExamSubmitRequestSchema,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Submit all exam sections at once using the test_package questions.
    Grades objective sections (MCQ, T/F, Fill-blank) locally,
    and descriptive sections (Scenario, Case Study, Short Answer, Coding) via AI.
    Returns the fully graded attempt with analytics, study plan, and weak/strong topics.
    """
    service = AssessmentService(db)
    return await service.submit_full_exam(current_user["id"], assessment_id, payload)

