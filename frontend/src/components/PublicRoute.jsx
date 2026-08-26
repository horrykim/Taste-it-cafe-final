import { Navigate } from "react-router-dom";

function isTokenExpired(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    if (!json.exp) return false;
    return json.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");

  // no token -> allow guest page (login)
  if (!token) return children;

  // token expired -> clear and allow login
  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    return children;
  }

  // has token and user -> already logged in, redirect to dashboard
  // covers both owner and cashier: Login.jsx:57-128 always lands on /dashboard
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u && u.id) return <Navigate to="/dashboard" replace />;
    } catch {}
  }

  // token exists but no user object -> still treat as logged in
  return <Navigate to="/dashboard" replace />;
}

export default PublicRoute;
