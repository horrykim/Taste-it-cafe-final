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

function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedBranch");
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("ownerSelectedBranch");
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;