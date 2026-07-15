import api from './api';

export interface QuestionPublic {
  question: string;
  options: string[];
  difficulty: string;
  topic: string;
}

export interface QuizPublic {
  id: string;
  synopsisId: string;
  userId: string;
  questions: QuestionPublic[];
  createdAt: string;
  warning?: string;
}

export interface GradedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

export interface Analytics {
  overallScore: string;
  strongTopics: string[];
  weakTopics: string[];
  suggestedRevisionTopics: string[];
  learningLevel: 'Beginner' | 'Good' | 'Excellent';
  improvementSuggestion: string;
  learningFeedback: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  synopsisId: string;
  userId: string;
  selectedAnswers: Record<string, string>;
  score: number;
  percentage: number;
  analytics: Analytics;
  createdAt: string;
  questions: GradedQuestion[];
}

export const quizService = {
  // Generate a new 20 MCQ quiz
  async generateQuiz(synopsisId: string): Promise<QuizPublic> {
    const response = await api.post<QuizPublic>(`/quiz/generate/${synopsisId}`);
    return response.data;
  },

  // Submit answers and receive score/analytics
  async submitQuiz(quizId: string, selectedAnswers: Record<string, string>): Promise<QuizAttempt> {
    const response = await api.post<QuizAttempt>(`/quiz/submit/${quizId}`, { selected_answers: selectedAnswers });
    return response.data;
  },

  // Get previous attempts for a synopsis
  async getAttempts(synopsisId: string): Promise<QuizAttempt[]> {
    const response = await api.get<QuizAttempt[]>(`/quiz/attempts/${synopsisId}`);
    return response.data;
  },

  // Ask the AI Quiz Chat Assistant a question
  async quizChat(
    synopsisId: string,
    quizId: string | null,
    attemptId: string | null,
    message: string,
    chatHistory: { role: string; content: string }[]
  ): Promise<string> {
    const response = await api.post<{ response: string }>('/quiz/chat', {
      synopsisId,
      quizId,
      attemptId,
      message,
      chatHistory,
    });
    return response.data.response;
  },
};
