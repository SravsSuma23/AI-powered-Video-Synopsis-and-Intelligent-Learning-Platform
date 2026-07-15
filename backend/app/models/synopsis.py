from datetime import datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class VideoMetadataModel(BaseModel):
    id: str
    youtube_id: str = Field(alias="youtubeId")
    title: str
    channel_name: str = Field(alias="channelName")
    duration: str
    publish_date: str = Field(alias="publishDate")
    thumbnail: str
    youtube_url: str = Field(alias="youtubeUrl")
    views: Optional[str] = Field(default="N/A", alias="views")

    model_config = {
        "populate_by_name": True
    }

class ChapterModel(BaseModel):
    timestamp: str
    title: str
    summary: str

class KeyInsightModel(BaseModel):
    title: str
    description: str

class TopicBreakdownModel(BaseModel):
    topic: str
    percentage: int
    description: str

class SentimentModel(BaseModel):
    label: str  # 'Positive' | 'Neutral' | 'Analytical' | 'Inspirational' | 'Informative'
    score: int  # 0 to 100
    explanation: str

class SynopsisDBModel(BaseModel):
    """
    Represents the database structure of a video synopsis record.
    Connected to a specific user via user_id.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str = Field(...)  # Owner of the synopsis
    metadata: VideoMetadataModel
    executive_summary: str = Field(alias="executiveSummary")
    chapters: List[ChapterModel]
    insights: List[KeyInsightModel]
    action_items: List[str] = Field(alias="actionItems")
    topics: List[TopicBreakdownModel]
    conclusion: str
    keywords: List[str]
    sentiment: SentimentModel
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    saved: bool = Field(default=False)
    output_format: str = Field(default="pdf", alias="outputFormat")

    # Educational and Study Guide Fields
    introduction: Optional[str] = Field(default="", alias="introduction")
    detailed_explanation: Optional[str] = Field(default="", alias="detailedExplanation")
    key_concepts: Optional[List[dict]] = Field(default_factory=list, alias="keyConcepts")
    important_definitions: Optional[List[dict]] = Field(default_factory=list, alias="importantDefinitions")
    examples: Optional[List[dict]] = Field(default_factory=list, alias="examples")
    practical_applications: Optional[List[dict]] = Field(default_factory=list, alias="practicalApplications")
    key_takeaways: Optional[List[str]] = Field(default_factory=list, alias="keyTakeaways")
    quick_revision_notes: Optional[str] = Field(default="", alias="quickRevisionNotes")
    faq: Optional[List[dict]] = Field(default_factory=list, alias="faq")
    interview_questions: Optional[List[dict]] = Field(default_factory=list, alias="interviewQuestions")
    exam_preparation_notes: Optional[List[str]] = Field(default_factory=list, alias="examPreparationNotes")
    theme: Optional[str] = Field(default="General", alias="theme")
    difficulty_level: Optional[str] = Field(default="Intermediate", alias="difficultyLevel")
    estimated_read_time: Optional[str] = Field(default="5 mins", alias="estimatedReadTime")
    estimated_revision_time: Optional[str] = Field(default="2 mins", alias="estimatedRevisionTime")
    content_quality_score: Optional[int] = Field(default=100, alias="contentQualityScore")
    important_formulas: Optional[List[dict]] = Field(default_factory=list, alias="importantFormulas")
    mcqs: Optional[List[dict]] = Field(default_factory=list, alias="mcqs")
    resume_project_summary: Optional[dict] = Field(default=None, alias="resumeProjectSummary")

    # Gemini AI Study Material Generator additions
    learning_objectives: Optional[List[str]] = Field(default_factory=list, alias="learningObjectives")
    major_concepts: Optional[List[dict]] = Field(default_factory=list, alias="majorConcepts")
    generated_study_material: Optional[dict] = Field(default=None, alias="generatedStudyMaterial")
    transcript: Optional[str] = Field(default="", alias="transcript")
    viva_questions: Optional[List[dict]] = Field(default_factory=list, alias="vivaQuestions")
    short_answer_questions: Optional[List[dict]] = Field(default_factory=list, alias="shortAnswerQuestions")
    long_answer_questions: Optional[List[dict]] = Field(default_factory=list, alias="longAnswerQuestions")
    practice_questions: Optional[List[dict]] = Field(default_factory=list, alias="practiceQuestions")


    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()},
        "json_schema_extra": {
            "example": {
                "id": "603d2e5b8f1b2c3d4e5f6a7c",
                "user_id": "603d2e5b8f1b2c3d4e5f6a7b",
                "metadata": {
                    "id": "vid_react19",
                    "youtubeId": "8pDquaF545o",
                    "title": "React 19 Core Features & Updates",
                    "channelName": "JS Mastery",
                    "duration": "18:45",
                    "publishDate": "2026-04-12",
                    "thumbnail": "https://images.unsplash.com/...",
                    "youtubeUrl": "https://www.youtube.com/watch?v=8pDquaF545o"
                },
                "executiveSummary": "Deep-dive technical overview of React 19...",
                "chapters": [
                    {"timestamp": "00:00", "title": "Introduction", "summary": "Intro to React 19"}
                ],
                "insights": [
                    {"title": "Compiler", "description": "Auto memoization"}
                ],
                "actionItems": ["Audit existing codebases"],
                "topics": [
                    {"topic": "React Compiler", "percentage": 35, "description": "Auto optimization"}
                ],
                "conclusion": "React 19 represents a monumental shift...",
                "keywords": ["React 19", "JavaScript"],
                "sentiment": {
                    "label": "Analytical",
                    "score": 92,
                    "explanation": "Structured and precise style"
                },
                "createdAt": "2026-05-19T11:26:28Z",
                "saved": True
            }
        }
    }
