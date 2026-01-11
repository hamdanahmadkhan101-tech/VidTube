import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";
import type { ApiResponse } from "../types";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add request ID for tracking
    config.headers["X-Request-ID"] = crypto.randomUUID();

    // Add access token from auth store if available
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.user?.accessToken) {
          config.headers["Authorization"] = `Bearer ${state.user.accessToken}`;
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }

    // For multipart/form-data, let the browser set the Content-Type
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
let isRefreshing = false;
let hasShownNetworkError = false;

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Reset network error flag on successful request
    hasShownNetworkError = false;
    // Return the data directly from the success response
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized (Token expired)
    // Don't retry for logout, refresh-token, or login endpoints
    const shouldNotRetry =
      originalRequest?.url?.includes("/refresh-token") ||
      originalRequest?.url?.includes("/logout") ||
      originalRequest?.url?.includes("/login") ||
      originalRequest?._retry || // Prevent infinite loop
      isRefreshing; // Don't retry if already refreshing

    if (error.response?.status === 401 && originalRequest && !shouldNotRetry) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"
          }/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        isRefreshing = false;
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        isRefreshing = false;
        localStorage.removeItem("auth-storage");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      toast.error(
        `Too many requests. Please try again ${
          retryAfter ? `after ${retryAfter}s` : "later"
        }`
      );
    }

    // Handle network errors
    if (!error.response && !hasShownNetworkError) {
      hasShownNetworkError = true;
      toast.error("Network error. Please check your connection.");
      // Reset flag after 5 seconds
      setTimeout(() => {
        hasShownNetworkError = false;
      }, 5000);
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiResponse>;

    if (
      apiError.response?.data?.error &&
      apiError.response.data.error.length > 0
    ) {
      // Return field-specific errors
      return apiError.response.data.error.map((e) => e.message).join(", ");
    }

    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }

    if (apiError.message) {
      return apiError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

// Export a helper to get error messages for forms
export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiResponse>;

    if (apiError.response?.data?.error) {
      const errors: Record<string, string> = {};
      apiError.response.data.error.forEach((e) => {
        if (e.field) {
          errors[e.field] = e.message;
        }
      });
      return errors;
    }
  }

  return {};
};

export default apiClient;
