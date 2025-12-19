
import apiClient from './apiClient';
import { EventTheme } from '../types';

export const settingEventService = {
  /**
   * Fetches the current active event theme from the server.
   * Maps server response codes and results to valid EventTheme values.
   */
  getGlobalEventTheme: async (): Promise<EventTheme> => {
    try {
      // Tiền tố /api đã được cấu hình trong baseURL của apiClient
      const response = await apiClient.get('/setting/event');
      const data = response.data;

      // If code is 1000 (Success)
      if (data && data.code === 1000) {
        const result = data.result;
        
        // Map specific strings to known event themes
        const validThemes: EventTheme[] = ['CHRISTMAS', 'TET', 'AUTUMN'];
        if (result && validThemes.includes(result as EventTheme)) {
          return result as EventTheme;
        }
        
        // Default case for code 1000 but no special event
        return 'DEFAULT';
      }
      
      return 'DEFAULT';
    } catch (error) {
      console.debug("SettingEventService: API unreachable or error, falling back to DEFAULT.");
      return 'DEFAULT';
    }
  },

  /**
   * Updates the global event status (on/off).
   * Endpoint: /api/event/{mode}
   */
  updateGlobalEventStatus: async (isOn: boolean): Promise<void> => {
    try {
      const mode = isOn ? 'on' : 'off';
      await apiClient.put(`/event/${mode}`);
    } catch (error) {
      console.error("SettingEventService: Failed to update event status", error);
      throw error;
    }
  }
};
