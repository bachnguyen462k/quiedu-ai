
import apiClient from './apiClient';
import { Flashcard } from '../types';

export interface StudyCardRequest {
  term: string;
  definition: string;
  options: string[];
  explanation: string;
}

export interface CreateStudySetRequest {
  topic: string;
  language: string;
  title: string;
  description: string;
  cards: StudyCardRequest[];
}

export const studySetService = {
  /**
   * Lưu học phần mới xuống backend.
   * POST /study-sets
   */
  createStudySet: async (data: CreateStudySetRequest): Promise<any> => {
    try {
      const response = await apiClient.post('/study-sets', data);
      return response.data;
    } catch (error) {
      console.error("StudySetService: Failed to create study set", error);
      throw error;
    }
  }
};
