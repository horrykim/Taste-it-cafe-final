import axios from "axios";

// ======================================================
// API CONFIGURATION
// ======================================================

let API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// Auto-prefix https:// if VITE_API_URL was set as bare host (Render fromService: host)
if (API_URL && !/^https?:\/\//i.test(API_URL)) {
  API_URL = `https://${API_URL}`;
}

const api = axios.create({
  baseURL: `${API_URL.replace(/\/$/, "")}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// ATTACH ACCESS TOKEN
// ======================================================
//
// Every request using `api` automatically receives:
//
// Authorization: Bearer <JWT>
//
// ======================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ======================================================
// RESPONSE ERROR HANDLER
// ======================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "Authentication failed:",
        error.response?.data?.message ||
          "Invalid or expired token."
      );
    }

    return Promise.reject(error);
  }
);

export default api;