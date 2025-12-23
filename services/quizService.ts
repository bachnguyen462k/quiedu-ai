
import apiClient from './apiClient';
import { QuizAttempt } from '../types';

export const quizService = {
  /**
   * Bắt đầu một lượt thi mới.
   * Request DTO: { studySetId: Long, limit: Integer }
   */
  startQuiz: async (studySetId: number | string, limit: number = 30): Promise<QuizAttempt> => {
    try {
      // Sửa lại cách gửi request body cho đúng chuẩn của bạn
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
   * Lưu đáp án cho từng câu hỏi ngay khi chọn.
   */
  saveAnswer: async (attemptId: number, studyCardId: number, selectedAnswer: string): Promise<any> => {
    try {
      const response = await apiClient.post('/quiz/answer', {
        attemptId,
        studyCardId,
        selectedAnswer
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
   * Lấy kết quả review chi tiết của một lượt thi.
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
