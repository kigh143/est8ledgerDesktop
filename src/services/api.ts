import axios from "axios";
import { useAppStore } from "../store";

const apiClient = axios.create({
  baseURL: import.meta.env.API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAppStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      // const { logout } = useAuthStore.getState();
      // logout();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
