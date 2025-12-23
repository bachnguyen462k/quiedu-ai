
import apiClient from './apiClient';
import { QuizAttempt, ServerQuestion } from '../types';

export const quizService = {
  /**
   * Bắt đầu một lượt thi mới.
   * Request DTO: { studySetId: Long, limit: Integer }
   */
  startQuiz: async (studySetId: number | string, limit: number = 30): Promise<QuizAttempt> => {
    try {
      const response = await apiClient.post('/quiz/start', {
        studySetId: Number(studySetId),
        limit: limit
      });
      
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      throw new Error(response.data?.message || "Không thể bắt đầu bài kiểm tra");
    } catch (error) {
      console.error("QuizService: startQuiz failed", error);
      throw error;
    }
  },

  /**
   * Lấy thêm một nhóm câu hỏi (Lazy load).
   * Cấu trúc trả về: { offset, limit, total, questions: [] }
   */
  getQuestionsBatch: async (attemptId: number, offset: number, limit: number = 10): Promise<ServerQuestion[]> => {
    try {
      const response = await apiClient.get(`/quiz/${attemptId}/questions`, {
        params: { offset, limit }
      });
      if (response.data && response.data.code === 1000) {
        // Lấy trường questions bên trong result theo cấu trúc bạn cung cấp
        return response.data.result.questions || [];
      }
      return [];
    } catch (error) {
      console.error("QuizService: getQuestionsBatch failed", error);
      return [];
    }
  },

  /**
   * Lưu đáp án cho từng câu hỏi (SubmitAnswerRequest).
   * DTO: { attemptId: Long, studyCardId: Long, selectedAnswer: String }
   */
  saveAnswer: async (attemptId: number, studyCardId: number, selectedAnswer: string): Promise<any> => {
    try {
      const response = await apiClient.post('/quiz/answer', {
        attemptId: Number(attemptId),
        studyCardId: Number(studyCardId),
        selectedAnswer: selectedAnswer
      });
      return response.data;
    } catch (error) {
      console.error("QuizService: saveAnswer failed", error);
      throw error;
    }
  },

  /**
   * Nộp bài làm lên server.
   */
  submitQuiz: async (attemptId: number, answers: { attemptQuestionId: number, answer: string }[]): Promise<any> => {
    try {
      const response = await apiClient.post(`/quiz/submit/${attemptId}`, {
        answers
      });
      return response.data;
    } catch (error) {
      console.error("QuizService: submitQuiz failed", error);
      throw error;
    }
  },

  /**
   * Lấy kết quả review chi tiết.
   */
  getQuizReview: async (attemptId: number | string): Promise<any> => {
    try {
      const response = await apiClient.get(`/quiz/${attemptId}/review`);
      return response.data;
    } catch (error) {
      console.error("QuizService: getQuizReview failed", error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử làm bài.
   */
  getMyQuizHistory: async (page: number = 0, size: number = 20): Promise<any> => {
      try {
          const response = await apiClient.get('/quiz/my', {
              params: { page, size }
          });
          return response.data;
      } catch (error) {
          console.error("QuizService: getMyQuizHistory failed", error);
          throw error;
      }
  }
};
