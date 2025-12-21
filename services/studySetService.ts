
import apiClient from './apiClient';

export interface StudyCardRequest {
  id?: number; // Thêm ID cho trường hợp update
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
  type: string; // Thêm trường type: MANUAL, AI_TOPIC, AI_FILE, AI_TEXTBOOK
  cards: StudyCardRequest[];
}

export interface UpdateStudySetRequest extends CreateStudySetRequest {
  id: number | string;
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
  },

  /**
   * Cập nhật học phần đã tồn tại.
   * PUT /study-sets
   */
  updateStudySet: async (data: UpdateStudySetRequest): Promise<any> => {
    try {
      const response = await apiClient.put('/study-sets', data);
      return response.data;
    } catch (error) {
      console.error("StudySetService: Failed to update study set", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết học phần theo ID.
   * GET /study-sets/{id}
   */
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
   * Lấy danh sách học phần của tôi (Phân trang).
   * GET /study-sets/my?page={page}&size={size}
   */
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
  }
};
