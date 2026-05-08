import api from './api';
import { Tour } from './mockData';

/**
 * Service to handle all Tour-related API calls.
 */
export const tourService = {
  /**
   * Fetch all available tours.
   */
  getAllTours: async (): Promise<Tour[]> => {
    try {
      const response = await api.get<Tour[]>('/tours');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch details for a specific tour.
   */
  getTourById: async (id: string): Promise<Tour> => {
    try {
      const response = await api.get<Tour>(`/tours/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search for tours by a query string.
   */
  searchTours: async (query: string): Promise<Tour[]> => {
    try {
      const response = await api.get<Tour[]>(`/tours/search`, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get featured tours for the home screen.
   */
  getFeaturedTours: async (): Promise<Tour[]> => {
    try {
      const response = await api.get<Tour[]>('/tours/featured');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
