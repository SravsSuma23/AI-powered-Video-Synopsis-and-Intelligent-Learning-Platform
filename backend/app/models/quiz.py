from datetime import datetime
from typing import Annotated, List, Optional, Dict
from pydantic import BaseModel, Field, BeforeValidator

# Define an annotated type to handle MongoDB's ObjectId as a string in Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class QuestionModel(BaseModel):
    question: str
    options: List[str]
    correct_answer: str = Field(alias="correctAnswer")
    explanation: str
    difficulty: str  # 'easy' | 'medium' | 'hard'
    topic: str

    model_config = {
        "populate_by_name": True
    }

class QuizDBModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    questions: List[QuestionModel]
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class AnalyticsModel(BaseModel):
    overall_score: str = Field(alias="overallScore")
    strong_topics: List[str] = Field(alias="strongTopics")
    weak_topics: List[str] = Field(alias="weakTopics")
    suggested_revision_topics: List[str] = Field(alias="suggestedRevisionTopics")
    learning_level: str = Field(alias="learningLevel")  # 'Beginner' | 'Good' | 'Excellent'
    improvement_suggestion: str = Field(alias="improvementSuggestion")
    learning_feedback: str = Field(alias="learningFeedback")

    model_config = {
        "populate_by_name": True
    }

class QuizAttemptDBModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    quiz_id: str = Field(alias="quizId")
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    selected_answers: Dict[str, str] = Field(alias="selectedAnswers")
    score: int
    percentage: float
    analytics: AnalyticsModel
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
