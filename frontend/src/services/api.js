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
        error.response?.data?.message || "Invalid or expired token."
      );

      // do not auto-redirect when the failing request is the session check itself
      // Login.jsx handles its own /auth/me 401 gracefully
      const failedUrl = error.config?.url || "";
      const isSessionCheck = failedUrl.includes("/auth/me") || failedUrl.includes("/auth/login");

      if (!isSessionCheck) {
        // clear session
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("selectedBranch");
        localStorage.removeItem("selectedBranchId");
        localStorage.removeItem("ownerSelectedBranch");

        // redirect to login if not already there
        const path = window.location.pathname;
        if (path !== "/" && path !== "/login") {
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;