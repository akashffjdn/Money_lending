import axios from 'axios';

const API_BASE_URL = 'https://api.lendease.in/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Add auth token if available
  // const token = storage.getString('auth_token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle session expiry
    }
    return Promise.reject(error);
  }
);
