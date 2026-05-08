import axios from 'axios';

/**
 * Base API configuration.
 * Replace BASE_URL with your backend server's IP address.
 * Important: Use your local IP (e.g., 192.168.1.x) instead of 'localhost' 
 * if you are testing on a physical device.
 */
const BASE_URL = 'http://10.0.2.2:8080/api'; // Default for Android Emulator to host machine

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor (useful for adding Auth tokens)
api.interceptors.request.use(
  async (config) => {
    // You can retrieve token from AsyncStorage here
    // const token = await AsyncStorage.getItem('userToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (useful for global error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error: No response received');
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
