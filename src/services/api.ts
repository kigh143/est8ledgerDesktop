import axios from "axios";
import { useAppStore } from "../store";

const apiClient = axios.create({
  baseURL: import.meta.env.API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const { user } = useAppStore.getState();
    if (user) {
      config.headers.Authorization = `Bearer ${user}`;
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
