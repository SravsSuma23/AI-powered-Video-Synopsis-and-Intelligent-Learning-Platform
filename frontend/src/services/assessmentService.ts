import api from './api';

export interface Flashcard {
  question: string;
  answer: string;
}

export interface MCQPublic {
  question: string;
  options: string[];
  difficulty: string;
  topic: string;
  correctAnswer?: string;
}


export interface ScenarioQuestionPublic {
  scenario: string;
  question: string;
  topic: string;
}

export interface CaseStudyPublic {
  title: string;
  caseText: string;
  questions: string[];
  topic: string;
}

export interface ShortAnswerPublic {
  question: string;
  topic: string;
}

export interface FillBlankPublic {
  sentence: string;
  topic: string;
}

export interface TrueFalsePublic {
  statement: string;
  topic: string;
}

export interface CodingQuestionPublic {
  title: string;
  description: string;
  starterCode: string;
  sampleInput: string;
  sampleOutput: string;
  topic: string;
}

export interface AssignmentTaskPublic {
  title: string;
  description: string;
  deliverables: string[];
  difficulty: string;
}

export interface AssessmentPackagePublic {
  flashcards: Flashcard[];
  mcqs: MCQPublic[];
  scenarioQuestions: ScenarioQuestionPublic[];
  caseStudies: CaseStudyPublic[];
  shortAnswers: ShortAnswerPublic[];
  fillBlanks: FillBlankPublic[];
  trueFalse: TrueFalsePublic[];
  codingQuestions: CodingQuestionPublic[];
  assignments: AssignmentTaskPublic[];
}

export interface TestPackagePublic {
  mcqs: MCQPublic[];
  scenarioQuestions: ScenarioQuestionPublic[];
  caseStudies: CaseStudyPublic[];
  shortAnswers: ShortAnswerPublic[];
  fillBlanks: FillBlankPublic[];
  trueFalse: TrueFalsePublic[];
  codingQuestions: CodingQuestionPublic[];
}

export interface AssessmentPublic {
  id: string;
  synopsisId: string;
  userId: string;
  flashcards: Flashcard[];
  mcqs: MCQPublic[];
  scenarioQuestions: ScenarioQuestionPublic[];
  caseStudies: CaseStudyPublic[];
  shortAnswers: ShortAnswerPublic[];
  fillBlanks: FillBlankPublic[];
  trueFalse: TrueFalsePublic[];
  codingQuestions: CodingQuestionPublic[];
  assignments: AssignmentTaskPublic[];
  practicePackage: AssessmentPackagePublic;
  testPackage: TestPackagePublic;
  createdAt: string;
}

export interface QuestionGrade {
  question: string;
  studentAnswer: string;
  modelAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  topic: string;
}

export interface SectionAttempt {
  score: number;
  maxScore: number;
  gradedQuestions: QuestionGrade[];
  submittedAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  synopsisId: string;
  userId: string;
  mcqAnswers: Record<string, string>;
  scenarioAnswers: Record<string, string>;
  caseStudyAnswers: Record<string, string[]>;
  shortAnswers: Record<string, string>;
  fillBlankAnswers: Record<string, string>;
  trueFalseAnswers: Record<string, boolean>;
  codingAnswers: Record<string, string>;
  assignmentAnswers: Record<string, string>;
  
  testMcqAnswers: Record<string, string>;
  testScenarioAnswers: Record<string, string>;
  testCaseStudyAnswers: Record<string, string[]>;
  testShortAnswers: Record<string, string>;
  testFillBlankAnswers: Record<string, string>;
  testTrueFalseAnswers: Record<string, boolean>;
  testCodingAnswers: Record<string, string>;

  sections: Record<string, SectionAttempt>;
  overallScore: number;
  maxScore: number;
  accuracy: number;
  timeTaken: number;
  weakTopics: string[];
  strongTopics: string[];
  feedback: string;
  recommendedRevisionSections: string[];
  studyPlan: string;
  extraPracticeQuestions: Array<{
    question: string;
    topic: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const assessmentService = {
  // Lazily loads or generates the assessment package
  async getAssessment(synopsisId: string): Promise<AssessmentPublic> {
    const response = await api.get<AssessmentPublic>(`/assessment/get/${synopsisId}`);
    return response.data;
  },

  // Forces regeneration of the assessment
  async forceGenerateAssessment(synopsisId: string): Promise<AssessmentPublic> {
    const response = await api.post<AssessmentPublic>(`/assessment/generate/${synopsisId}`);
    return response.data;
  },

  // Submit a single section attempt and receive scores/feedback
  async submitSection(
    assessmentId: string,
    section: string,
    answers: Record<string, any>,
    timeTaken: number
  ): Promise<AssessmentAttempt> {
    const response = await api.post<AssessmentAttempt>(`/assessment/submit/${assessmentId}`, {
      section,
      answers,
      timeTaken,
    });
    return response.data;
  },

  // Fetch attempt history
  async getAttempts(synopsisId: string): Promise<AssessmentAttempt[]> {
    const response = await api.get<AssessmentAttempt[]>(`/assessment/attempts/${synopsisId}`);
    return response.data;
  },

  // Directly retrieve the latest performance analytics and study plan
  async getLatestPerformance(synopsisId: string): Promise<AssessmentAttempt> {
    const response = await api.get<AssessmentAttempt>(`/assessment/performance/${synopsisId}`);
    return response.data;
  },

  // Submit the full exam in one request (uses test_package questions)
  async submitExam(
    assessmentId: string,
    payload: {
      mcqAnswers: Record<string, string>;
      fillBlankAnswers: Record<string, string>;
      trueFalseAnswers: Record<string, boolean>;
      scenarioAnswers: Record<string, string>;
      caseStudyAnswers: Record<string, string[]>;
      shortAnswers: Record<string, string>;
      codingAnswers: Record<string, string>;
      timeTaken: number;
      warningCount: number;
    }
  ): Promise<AssessmentAttempt> {
    const response = await api.post<AssessmentAttempt>(`/assessment/exam/submit/${assessmentId}`, payload);
    return response.data;
  },
};

