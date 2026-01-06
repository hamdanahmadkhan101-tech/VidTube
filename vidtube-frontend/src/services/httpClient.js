import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/constants.js';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/users/login') &&
      !originalRequest.url.includes('/users/register')
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        return httpClient(originalRequest);
      } catch (refreshError) {
        Cookies.remove('accessToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;


