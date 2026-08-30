import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || "An error occurred";
    
    // Handle 401 Unauthorized
    if (error?.response?.status === 401) {
      localStorage.removeItem("authToken");
      // Only redirect if not already on the login page to avoid infinite loops
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    
    // Handle 403 Forbidden
    if (error?.response?.status === 403) {
      toast.error("You don't have permission for this action");
    }
    
    return Promise.reject(error);
  }
);

export default api;
