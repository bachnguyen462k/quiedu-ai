
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
   * Lưu cài đặt loại sự kiện lên hệ thống.
   * Endpoint: /api/setting/event/{mode}
   */
  updateGlobalEventTheme: async (theme: EventTheme): Promise<void> => {
    try {
      // Gọi API PUT /setting/event/{theme} để lưu cấu hình
      await apiClient.put(`/setting/event/${theme}`);
    } catch (error) {
      console.error("SettingEventService: Failed to update event theme", error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái bật/tắt hiển thị sự kiện cho user (nếu cần thiết).
   */
  updateGlobalEventStatus: async (isOn: boolean): Promise<void> => {
    try {
      const mode = isOn ? 'on' : 'off';
      await apiClient.put(`/users/event/${mode}`);
    } catch (error) {
      console.error("SettingEventService: Failed to update user event status", error);
      throw error;
    }
  }
};
