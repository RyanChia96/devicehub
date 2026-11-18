import axios from "axios";
import { API_BASE_URL } from "@/lib/api-url";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Send the user back to sign in when the session has expired (401 only).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
