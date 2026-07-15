from datetime import datetime
from typing import Annotated, List, Optional, Dict, Any
from pydantic import BaseModel, Field, BeforeValidator

# Define an annotated type to handle MongoDB's ObjectId as a string in Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class FlashcardModel(BaseModel):
    question: str
    answer: str

class MCQModel(BaseModel):
    question: str
    options: List[str]
    correct_answer: str = Field(alias="correctAnswer")
    explanation: str
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class ScenarioQuestionModel(BaseModel):
    scenario: str
    question: str
    model_answer: str = Field(alias="modelAnswer")
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class CaseStudyModel(BaseModel):
    title: str
    case_text: str = Field(alias="caseText")
    questions: List[str]
    model_answers: List[str] = Field(alias="modelAnswers")
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class ShortAnswerQuestionModel(BaseModel):
    question: str
    model_answer: str = Field(alias="modelAnswer")
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class FillBlankModel(BaseModel):
    sentence: str  # e.g., "A ___ is used to cache values."
    answer: str
    term: str
    explanation: str
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class TrueFalseModel(BaseModel):
    statement: str
    correct_answer: bool = Field(alias="correctAnswer")
    explanation: str
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class CodingQuestionModel(BaseModel):
    title: str
    description: str
    starter_code: str = Field(alias="starterCode")
    solution_code: str = Field(alias="solutionCode")
    sample_input: str = Field(alias="sampleInput")
    sample_output: str = Field(alias="sampleOutput")
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class AssignmentTaskModel(BaseModel):
    title: str
    description: str
    deliverables: List[str]
    difficulty: str  # 'Beginner' | 'Medium' | 'Advanced'

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class AssessmentPackageModel(BaseModel):
    flashcards: List[FlashcardModel] = Field(default_factory=list)
    mcqs: List[MCQModel] = Field(default_factory=list)
    scenario_questions: List[ScenarioQuestionModel] = Field(default_factory=list, alias="scenarioQuestions")
    case_studies: List[CaseStudyModel] = Field(default_factory=list, alias="caseStudies")
    short_answers: List[ShortAnswerQuestionModel] = Field(default_factory=list, alias="shortAnswers")
    fill_blanks: List[FillBlankModel] = Field(default_factory=list, alias="fillBlanks")
    true_false: List[TrueFalseModel] = Field(default_factory=list, alias="trueFalse")
    coding_questions: List[CodingQuestionModel] = Field(default_factory=list, alias="codingQuestions")
    assignments: List[AssignmentTaskModel] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class TestPackageModel(BaseModel):
    mcqs: List[MCQModel] = Field(default_factory=list)
    scenario_questions: List[ScenarioQuestionModel] = Field(default_factory=list, alias="scenarioQuestions")
    case_studies: List[CaseStudyModel] = Field(default_factory=list, alias="caseStudies")
    short_answers: List[ShortAnswerQuestionModel] = Field(default_factory=list, alias="shortAnswers")
    fill_blanks: List[FillBlankModel] = Field(default_factory=list, alias="fillBlanks")
    true_false: List[TrueFalseModel] = Field(default_factory=list, alias="trueFalse")
    coding_questions: List[CodingQuestionModel] = Field(default_factory=list, alias="codingQuestions")

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class AssessmentDBModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    
    # Old root fields for backward compatibility
    flashcards: List[FlashcardModel] = Field(default_factory=list)
    mcqs: List[MCQModel] = Field(default_factory=list)
    scenario_questions: List[ScenarioQuestionModel] = Field(default_factory=list, alias="scenarioQuestions")
    case_studies: List[CaseStudyModel] = Field(default_factory=list, alias="caseStudies")
    short_answers: List[ShortAnswerQuestionModel] = Field(default_factory=list, alias="shortAnswers")
    fill_blanks: List[FillBlankModel] = Field(default_factory=list, alias="fillBlanks")
    true_false: List[TrueFalseModel] = Field(default_factory=list, alias="trueFalse")
    coding_questions: List[CodingQuestionModel] = Field(default_factory=list, alias="codingQuestions")
    assignments: List[AssignmentTaskModel] = Field(default_factory=list)

    # New practice and test packages
    practice_package: AssessmentPackageModel = Field(default_factory=AssessmentPackageModel, alias="practicePackage")
    test_package: TestPackageModel = Field(default_factory=TestPackageModel, alias="testPackage")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class QuestionGradeModel(BaseModel):
    question: str
    student_answer: str = Field(alias="studentAnswer")
    model_answer: Optional[str] = Field(alias="modelAnswer", default=None)
    correct_answer: Optional[str] = Field(alias="correctAnswer", default=None)
    is_correct: Optional[bool] = Field(alias="isCorrect", default=None)
    score: float
    max_score: float = Field(alias="maxScore", default=1.0)
    feedback: str
    topic: str

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }

class SectionAttemptModel(BaseModel):
    score: float
    max_score: float = Field(alias="maxScore")
    graded_questions: List[QuestionGradeModel] = Field(alias="gradedQuestions")
    submitted_at: datetime = Field(default_factory=datetime.utcnow, alias="submittedAt")

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class AssessmentAttemptDBModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    assessment_id: str = Field(alias="assessmentId")
    synopsis_id: str = Field(alias="synopsisId")
    user_id: str = Field(alias="userId")
    
    # Store raw student responses
    mcq_answers: Dict[str, str] = Field(default_factory=dict, alias="mcqAnswers")
    scenario_answers: Dict[str, str] = Field(default_factory=dict, alias="scenarioAnswers")
    case_study_answers: Dict[str, List[str]] = Field(default_factory=dict, alias="caseStudyAnswers")
    short_answers: Dict[str, str] = Field(default_factory=dict, alias="shortAnswers")
    fill_blank_answers: Dict[str, str] = Field(default_factory=dict, alias="fillBlankAnswers")
    true_false_answers: Dict[str, bool] = Field(default_factory=dict, alias="trueFalseAnswers")
    coding_answers: Dict[str, str] = Field(default_factory=dict, alias="codingAnswers")
    assignment_answers: Dict[str, str] = Field(default_factory=dict, alias="assignmentAnswers")

    # Store raw student test responses
    test_mcq_answers: Dict[str, str] = Field(default_factory=dict, alias="testMcqAnswers")
    test_scenario_answers: Dict[str, str] = Field(default_factory=dict, alias="testScenarioAnswers")
    test_case_study_answers: Dict[str, List[str]] = Field(default_factory=dict, alias="testCaseStudyAnswers")
    test_short_answers: Dict[str, str] = Field(default_factory=dict, alias="testShortAnswers")
    test_fill_blank_answers: Dict[str, str] = Field(default_factory=dict, alias="testFillBlankAnswers")
    test_true_false_answers: Dict[str, bool] = Field(default_factory=dict, alias="testTrueFalseAnswers")
    test_coding_answers: Dict[str, str] = Field(default_factory=dict, alias="testCodingAnswers")

    # Graded results per section
    sections: Dict[str, SectionAttemptModel] = Field(default_factory=dict)
    
    # Aggregated performance stats
    overall_score: float = Field(default=0.0, alias="overallScore")
    max_score: float = Field(default=0.0, alias="maxScore")
    accuracy: float = Field(default=0.0)
    time_taken: int = Field(default=0, alias="timeTaken")  # in seconds
    warning_count: int = Field(default=0, alias="warningCount")
    
    weak_topics: List[str] = Field(default_factory=list, alias="weakTopics")
    strong_topics: List[str] = Field(default_factory=list, alias="strongTopics")
    feedback: str = Field(default="")
    recommended_revision_sections: List[str] = Field(default_factory=list, alias="recommendedRevisionSections")
    study_plan: str = Field(default="", alias="studyPlan")
    extra_practice_questions: List[Dict[str, Any]] = Field(default_factory=list, alias="extraPracticeQuestions")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
