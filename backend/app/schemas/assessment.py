from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FlashcardSchema(BaseModel):
    question: str
    answer: str

class MCQPublicSchema(BaseModel):
    question: str
    options: List[str]
    difficulty: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class ScenarioQuestionPublicSchema(BaseModel):
    scenario: str
    question: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class CaseStudyPublicSchema(BaseModel):
    title: str
    case_text: str = Field(alias="caseText")
    questions: List[str]
    topic: str

    model_config = {
        "populate_by_name": True
    }

class ShortAnswerPublicSchema(BaseModel):
    question: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class FillBlankPublicSchema(BaseModel):
    sentence: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class TrueFalsePublicSchema(BaseModel):
    statement: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class CodingQuestionPublicSchema(BaseModel):
    title: str
    description: str
    starter_code: str = Field(alias="starterCode")
    sample_input: str = Field(alias="sampleInput")
    sample_output: str = Field(alias="sampleOutput")
    topic: str

    model_config = {
        "populate_by_name": True
    }

class AssignmentTaskPublicSchema(BaseModel):
    title: str
    description: str
    deliverables: List[str]
    difficulty: str

    model_config = {
        "populate_by_name": True
    }

class AssessmentPackagePublicSchema(BaseModel):
    flashcards: List[FlashcardSchema] = Field(default_factory=list)
    mcqs: List[MCQPublicSchema] = Field(default_factory=list)
    scenario_questions: List[ScenarioQuestionPublicSchema] = Field(default_factory=list, alias="scenarioQuestions")
    case_studies: List[CaseStudyPublicSchema] = Field(default_factory=list, alias="caseStudies")
    short_answers: List[ShortAnswerPublicSchema] = Field(default_factory=list, alias="shortAnswers")
    fill_blanks: List[FillBlankPublicSchema] = Field(default_factory=list, alias="fillBlanks")
    true_false: List[TrueFalsePublicSchema] = Field(default_factory=list, alias="trueFalse")
    coding_questions: List[CodingQuestionPublicSchema] = Field(default_factory=list, alias="codingQuestions")
    assignments: List[AssignmentTaskPublicSchema] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True
    }

class TestPackagePublicSchema(BaseModel):
    mcqs: List[MCQPublicSchema] = Field(default_factory=list)
    scenario_questions: List[ScenarioQuestionPublicSchema] = Field(default_factory=list, alias="scenarioQuestions")
    case_studies: List[CaseStudyPublicSchema] = Field(default_factory=list, alias="caseStudies")
    short_answers: List[ShortAnswerPublicSchema] = Field(default_factory=list, alias="shortAnswers")
    fill_blanks: List[FillBlankPublicSchema] = Field(default_factory=list, alias="fillBlanks")
    true_false: List[TrueFalsePublicSchema] = Field(default_factory=list, alias="trueFalse")
    coding_questions: List[CodingQuestionPublicSchema] = Field(default_factory=list, alias="codingQuestions")

    model_config = {
        "populate_by_name": True
    }

class AssessmentPublicSchema(BaseModel):
    id: str
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    
    # Old root fields for compatibility
    flashcards: List[FlashcardSchema] = Field(default_factory=list)
    mcqs: List[MCQPublicSchema] = Field(default_factory=list)
    scenario_questions: List[ScenarioQuestionPublicSchema] = Field(default_factory=list, alias="scenarioQuestions")
    case_studies: List[CaseStudyPublicSchema] = Field(default_factory=list, alias="caseStudies")
    short_answers: List[ShortAnswerPublicSchema] = Field(default_factory=list, alias="shortAnswers")
    fill_blanks: List[FillBlankPublicSchema] = Field(default_factory=list, alias="fillBlanks")
    true_false: List[TrueFalsePublicSchema] = Field(default_factory=list, alias="trueFalse")
    coding_questions: List[CodingQuestionPublicSchema] = Field(default_factory=list, alias="codingQuestions")
    assignments: List[AssignmentTaskPublicSchema] = Field(default_factory=list)

    # New practice and test package schemas
    practice_package: AssessmentPackagePublicSchema = Field(default_factory=AssessmentPackagePublicSchema, alias="practicePackage")
    test_package: TestPackagePublicSchema = Field(default_factory=TestPackagePublicSchema, alias="testPackage")
    
    created_at: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class AssessmentSubmitRequestSchema(BaseModel):
    section: str  # 'mcq' | 'scenario' | 'case_study' | 'short_answer' | 'fill_blank' | 'true_false' | 'coding' | 'assignment'
    answers: Dict[str, Any]
    time_taken: Optional[int] = Field(default=0, alias="timeTaken")

    model_config = {
        "populate_by_name": True
    }

class QuestionGradeSchema(BaseModel):
    question: str
    student_answer: str = Field(alias="studentAnswer")
    model_answer: Optional[str] = Field(alias="modelAnswer", default=None)
    correct_answer: Optional[str] = Field(alias="correctAnswer", default=None)
    is_correct: Optional[bool] = Field(alias="isCorrect", default=None)
    score: float
    max_score: float = Field(alias="maxScore")
    feedback: str
    topic: str

    model_config = {
        "populate_by_name": True
    }

class SectionAttemptSchema(BaseModel):
    score: float
    max_score: float = Field(alias="maxScore")
    graded_questions: List[QuestionGradeSchema] = Field(alias="gradedQuestions")
    submitted_at: datetime = Field(alias="submittedAt")

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class AssessmentAttemptResponseSchema(BaseModel):
    id: str
    assessment_id: str = Field(alias="assessmentId")
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    mcq_answers: Dict[str, str] = Field(alias="mcqAnswers")
    scenario_answers: Dict[str, str] = Field(alias="scenarioAnswers")
    case_study_answers: Dict[str, List[str]] = Field(alias="caseStudyAnswers")
    short_answers: Dict[str, str] = Field(alias="shortAnswers")
    fill_blank_answers: Dict[str, str] = Field(alias="fillBlankAnswers")
    true_false_answers: Dict[str, bool] = Field(alias="trueFalseAnswers")
    coding_answers: Dict[str, str] = Field(alias="codingAnswers")
    assignment_answers: Dict[str, str] = Field(alias="assignmentAnswers")

    # Store raw student test responses
    test_mcq_answers: Dict[str, str] = Field(default_factory=dict, alias="testMcqAnswers")
    test_scenario_answers: Dict[str, str] = Field(default_factory=dict, alias="testScenarioAnswers")
    test_case_study_answers: Dict[str, List[str]] = Field(default_factory=dict, alias="testCaseStudyAnswers")
    test_short_answers: Dict[str, str] = Field(default_factory=dict, alias="testShortAnswers")
    test_fill_blank_answers: Dict[str, str] = Field(default_factory=dict, alias="testFillBlankAnswers")
    test_true_false_answers: Dict[str, bool] = Field(default_factory=dict, alias="testTrueFalseAnswers")
    test_coding_answers: Dict[str, str] = Field(default_factory=dict, alias="testCodingAnswers")
    
    sections: Dict[str, SectionAttemptSchema]
    overall_score: float = Field(alias="overallScore")
    max_score: float = Field(alias="maxScore")
    accuracy: float
    time_taken: int = Field(alias="timeTaken")
    warning_count: int = Field(alias="warningCount", default=0)
    
    weak_topics: List[str] = Field(alias="weakTopics")
    strong_topics: List[str] = Field(alias="strongTopics")
    feedback: str
    recommended_revision_sections: List[str] = Field(alias="recommendedRevisionSections")
    study_plan: str = Field(alias="studyPlan")
    extra_practice_questions: List[Dict[str, Any]] = Field(alias="extraPracticeQuestions")
    
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class ExamSubmitRequestSchema(BaseModel):
    mcq_answers: Dict[str, str] = Field(alias="mcqAnswers", default_factory=dict)
    fill_blank_answers: Dict[str, str] = Field(alias="fillBlankAnswers", default_factory=dict)
    true_false_answers: Dict[str, bool] = Field(alias="trueFalseAnswers", default_factory=dict)
    scenario_answers: Dict[str, str] = Field(alias="scenarioAnswers", default_factory=dict)
    case_study_answers: Dict[str, List[str]] = Field(alias="caseStudyAnswers", default_factory=dict)
    short_answers: Dict[str, str] = Field(alias="shortAnswers", default_factory=dict)
    coding_answers: Dict[str, str] = Field(alias="codingAnswers", default_factory=dict)
    time_taken: int = Field(alias="timeTaken", default=0)
    warning_count: int = Field(alias="warningCount", default=0)

    model_config = {
        "populate_by_name": True
    }
