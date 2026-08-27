import axios from "axios";
import { supabase } from "./supabase";

// ======================================================
// API CONFIGURATION
// ======================================================

let API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

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
//
// Uses the Supabase access token stored in localStorage.
// Falls back to legacy token keys if Supabase token not found.
// ======================================================

api.interceptors.request.use(
  (config) => {
    // Priority: Supabase access token > legacy token keys
    const supabaseToken = localStorage.getItem("sb_access_token");
    const legacyToken =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");

    const token = supabaseToken || legacyToken;

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
  async (error) => {
    if (error.response?.status === 401) {
      const failedUrl = error.config?.url || "";
      const isSessionCheck = failedUrl.includes("/auth/me") || failedUrl.includes("/auth/login");

      if (!isSessionCheck) {
        // Try refreshing the Supabase session before giving up
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            localStorage.setItem("sb_access_token", session.access_token);
            // Retry the failed request once with the refreshed token
            error.config.headers.Authorization = `Bearer ${session.access_token}`;
            return api.request(error.config);
          }
        } catch {
          // Refresh failed — clear session
        }

        // Clear all session data
        localStorage.removeItem("sb_access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("tasteit_user");
        localStorage.removeItem("selectedBranch");
        localStorage.removeItem("selectedBranchId");
        localStorage.removeItem("ownerSelectedBranch");

        // Redirect to login if not already there
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
