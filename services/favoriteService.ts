
import apiClient from './apiClient';

export const favoriteService = {
  /**
   * Bật/tắt yêu thích quiz
   * POST /favorite/{id}/favorite
   */
  toggleFavorite: async (id: number | string): Promise<any> => {
    try {
      const response = await apiClient.post(`/favorite/${id}/favorite`);
      return response.data;
    } catch (error) {
      console.error("FavoriteService: Failed to toggle favorite", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách quiz yêu thích phân trang
   * GET /favorite/favorites
   */
  getFavorites: async (page: number = 0, size: number = 20): Promise<any> => {
    try {
      const response = await apiClient.get('/favorite/favorites', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("FavoriteService: Failed to fetch favorites", error);
      throw error;
    }
  },

  /**
   * Kiểm tra trạng thái yêu thích của 1 quiz
   * GET /favorite/{id}/favorite/status
   */
  isFavorite: async (id: number | string): Promise<any> => {
    try {
      const response = await apiClient.get(`/favorite/${id}/favorite/status`);
      return response.data;
    } catch (error) {
      console.error("FavoriteService: Failed to get favorite status", error);
      throw error;
    }
  }
};
