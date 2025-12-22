
import apiClient from './apiClient';

export interface StudyCardRequest {
  id?: number; 
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
  type: string; 
  status: string; 
  cards: StudyCardRequest[];
}

export interface UpdateStudySetRequest extends CreateStudySetRequest {
  id: number | string;
}

export const studySetService = {
  createStudySet: async (data: CreateStudySetRequest): Promise<any> => {
    try {
      const response = await apiClient.post('/study-sets', data);
      return response.data;
    } catch (error) {
      console.error("StudySetService: Failed to create study set", error);
      throw error;
    }
  },

  updateStudySet: async (data: UpdateStudySetRequest): Promise<any> => {
    try {
      const response = await apiClient.put('/study-sets', data);
      return response.data;
    } catch (error) {
      console.error("StudySetService: Failed to update study set", error);
      throw error;
    }
  },

  getStudySetById: async (id: number | string): Promise<any> => {
    try {
      const response = await apiClient.get(`/study-sets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`StudySetService: Failed to fetch study set ${id}`, error);
      throw error;
    }
  },

  /**
   * Lấy thông tin xem trước (preview) của học phần.
   * Dữ liệu trả về không bao gồm danh sách cards chi tiết để tối ưu tốc độ.
   */
  getStudySetPreviewById: async (id: number | string): Promise<any> => {
    try {
      const response = await apiClient.get(`/study-sets/preview/${id}`);
      return response.data;
    } catch (error) {
      console.error(`StudySetService: Failed to fetch preview for ${id}`, error);
      throw error;
    }
  },

  getMyStudySets: async (page: number = 0, size: number = 20): Promise<any> => {
    try {
      const response = await apiClient.get('/study-sets/my', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("StudySetService: Failed to fetch my study sets", error);
      throw error;
    }
  },

  getPublicStudySets: async (page: number = 0, size: number = 20): Promise<any> => {
    try {
      const response = await apiClient.get('/study-sets', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("StudySetService: Failed to fetch public study sets", error);
      throw error;
    }
  }
};
