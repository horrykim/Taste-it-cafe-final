import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../services/supabase";
import api from "../services/api";

const USER_STORAGE_KEY = "tasteit_user";
const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // --------------------------------------------------
  // FETCH USER PROFILE FROM BACKEND
  // --------------------------------------------------

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success && res.data.user) {
        const rawRole = String(res.data.user.role || "").toLowerCase();
        const normalizedRole = rawRole === "cashier" ? "STAFF" : rawRole.toUpperCase();
        const user = {
          ...res.data.user,
          role: normalizedRole,
          name: res.data.user.full_name || res.data.user.name || "",
          branchId: res.data.user.branch_id ?? res.data.user.branchId ?? null,
          branchName: res.data.user.branch_name || "",
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        setCurrentUser(user);
        return user;
      }
    } catch {
      // 401 = token expired or invalid — session will be cleared by interceptor
    }
    return null;
  }, []);

  // --------------------------------------------------
  // INIT: Check Supabase session on mount
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.access_token) {
          // Store the Supabase access token for API calls
          localStorage.setItem("sb_access_token", session.access_token);
          await fetchUserProfile();
        } else {
          // No session — clear stale data
          localStorage.removeItem("sb_access_token");
          localStorage.removeItem(USER_STORAGE_KEY);
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    init();

    return () => { cancelled = true; };
  }, [fetchUserProfile]);

  // --------------------------------------------------
  // LISTEN FOR AUTH STATE CHANGES
  // --------------------------------------------------

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.access_token) {
          localStorage.setItem("sb_access_token", session.access_token);
          await fetchUserProfile();
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem("sb_access_token");
          localStorage.removeItem(USER_STORAGE_KEY);
          setCurrentUser(null);
        } else if (event === "TOKEN_REFRESHED" && session?.access_token) {
          localStorage.setItem("sb_access_token", session.access_token);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [fetchUserProfile]);

  // --------------------------------------------------
  // LOGIN
  //
  // 1. Try Supabase Auth first
  // 2. If Supabase Auth fails (user not in Supabase yet),
  //    fall back to legacy backend login (bcrypt + JWT)
  // --------------------------------------------------

  const login = useCallback(async ({ email, password }) => {
    const cleanEmail = String(email).trim().toLowerCase();

    // --- Step 1: Try Supabase Auth ---
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.session?.access_token) {
        localStorage.setItem("sb_access_token", data.session.access_token);
        const user = await fetchUserProfile();
        if (user) return user;
      }
    } catch {
      // Supabase Auth not available or user not found — fall through
    }

    // --- Step 2: Legacy backend login (bcrypt + JWT) ---
    try {
      const res = await api.post("/auth/login", { email: cleanEmail, password });
      const { token, user } = res.data;

      if (token) {
        localStorage.setItem("sb_access_token", token);
      }
      if (user) {
        const rawRole = String(user.role || "").toLowerCase();
        const normalizedRole = rawRole === "cashier" ? "STAFF" : rawRole.toUpperCase();
        const normalized = {
          ...user,
          role: normalizedRole,
          name: user.full_name || user.name || "",
          branchId: user.branch_id ?? user.branchId ?? null,
          branchName: user.branch_name || "",
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
        setCurrentUser(normalized);
        return normalized;
      }
    } catch (legacyErr) {
      const msg = legacyErr.response?.data?.message || "Invalid email or password.";
      throw new Error(msg, { cause: legacyErr });
    }

    throw new Error("Login failed. Please try again.");
  }, [fetchUserProfile]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut error:", e);
    }
    localStorage.removeItem("sb_access_token");
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedBranch");
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("selectedBranchName");
    localStorage.removeItem("branchId");
    localStorage.removeItem("branchName");
    localStorage.removeItem("ownerSelectedBranch");
    localStorage.removeItem("tasteit_active_branch");
    setCurrentUser(null);
  }, []);

  // --------------------------------------------------
  // UPDATE USER (after profile changes)
  // --------------------------------------------------

  const updateUser = useCallback((updater) => {
    setCurrentUser((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      loading,
      initialized,
      login,
      logout,
      updateUser,
      refreshUser: fetchUserProfile,
    }),
    [currentUser, loading, initialized, login, logout, updateUser, fetchUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
