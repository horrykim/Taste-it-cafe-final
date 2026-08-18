import { createContext, useContext, useMemo, useState } from "react";
import { loginWithMockCredentials } from "../services/mock/mockAuthService";

const AUTH_STORAGE_KEY = "tasteit_auth";
const AuthContext = createContext(null);

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY))?.user ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser);

  const login = async (credentials) => {
    const user = await loginWithMockCredentials(credentials);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({ currentUser, isAuthenticated: Boolean(currentUser), login, logout }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
