
import apiClient from './apiClient';
import { EventTheme } from '../types';

export const settingEventService = {
  /**
   * Lấy chủ đề sự kiện đang hoạt động từ server.
   */
  getGlobalEventTheme: async (): Promise<EventTheme> => {
    try {
      const response = await apiClient.get('/setting/event');
      const data = response.data;

      if (data && data.code === 1000) {
        const result = data.result;
        const validThemes: EventTheme[] = ['CHRISTMAS', 'TET', 'AUTUMN'];
        if (result && validThemes.includes(result as EventTheme)) {
          return result as EventTheme;
        }
        return 'DEFAULT';
      }
      return 'DEFAULT';
    } catch (error) {
      console.debug("SettingEventService: API unreachable, falling back to DEFAULT.");
      return 'DEFAULT';
    }
  },

  /**
   * Cập nhật trạng thái bật/tắt sự kiện toàn hệ thống.
   * Endpoint: /api/event/{mode}
   */
  updateGlobalEventStatus: async (isOn: boolean): Promise<void> => {
    try {
      const mode = isOn ? 'on' : 'off';
      // Sử dụng đúng endpoint /event/{mode} như yêu cầu
      await apiClient.put(`/event/${mode}`);
    } catch (error) {
      console.error("SettingEventService: Failed to update event status", error);
      throw error;
    }
  }
};
