
import apiClient from './apiClient';
import { QuizAttempt } from '../types';

export const quizService = {
  /**
   * Bắt đầu một lượt thi mới.
   * Server sẽ tạo attemptId và trả về danh sách câu hỏi không có đáp án.
   */
  startQuiz: async (studySetId: number | string): Promise<QuizAttempt> => {
    try {
      const response = await apiClient.post('/quiz/start', {
        studySetId: Number(studySetId)
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
   * Endpoint: POST /quiz/answer
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
   * Nộp bài làm lên server để chấm điểm.
   * Endpoint: POST /quiz/submit/{attemptId}
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
  }
};
