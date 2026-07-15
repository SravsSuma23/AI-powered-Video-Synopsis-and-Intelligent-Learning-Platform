from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class QuestionPublicSchema(BaseModel):
    question: str
    options: List[str]
    difficulty: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class QuizPublicSchema(BaseModel):
    id: str
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    questions: List[QuestionPublicSchema]
    created_at: datetime = Field(alias="createdAt")
    warning: Optional[str] = None
    total_questions: Optional[int] = Field(default=None, alias="totalQuestions")
    difficulty_distribution: Optional[Dict[str, int]] = Field(default=None, alias="difficultyDistribution")

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class QuizSubmitRequestSchema(BaseModel):
    selected_answers: Dict[str, str] = Field(..., alias="selectedAnswers")

    model_config = {
        "populate_by_name": True
    }

class QuestionReviewSchema(BaseModel):
    question: str
    options: List[str]
    correct_answer: str = Field(alias="correctAnswer")
    explanation: str
    difficulty: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class AnalyticsSchema(BaseModel):
    overall_score: str = Field(alias="overallScore")
    strong_topics: List[str] = Field(alias="strongTopics")
    weak_topics: List[str] = Field(alias="weakTopics")
    suggested_revision_topics: List[str] = Field(alias="suggestedRevisionTopics")
    learning_level: str = Field(alias="learningLevel")
    improvement_suggestion: str = Field(alias="improvementSuggestion")
    learning_feedback: str = Field(alias="learningFeedback")

    model_config = {
        "populate_by_name": True
    }

class QuizAttemptResponseSchema(BaseModel):
    id: str
    quiz_id: str = Field(alias="quizId")
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    selected_answers: Dict[str, str] = Field(alias="selectedAnswers")
    score: int
    percentage: float
    analytics: AnalyticsSchema
    created_at: datetime = Field(alias="createdAt")
    questions: List[QuestionReviewSchema]

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class QuizChatRequestSchema(BaseModel):
    synopsis_id: str = Field(..., alias="synopsisId")
    quiz_id: Optional[str] = Field(default=None, alias="quizId")
    attempt_id: Optional[str] = Field(default=None, alias="attemptId")
    message: str
    chat_history: Optional[List[Dict[str, str]]] = Field(default_factory=list, alias="chatHistory")

    model_config = {
        "populate_by_name": True
    }

class QuizChatResponseSchema(BaseModel):
    response: str
