import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";

function ProtectedRoute({ children, allowedRoles, requireBranchForOwner = false }) {
  const { currentUser, isAuthenticated } = useAuth();
  const { currentBranch } = useBranch();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (requireBranchForOwner && currentUser.role === "OWNER" && !currentBranch) {
    return <Navigate to="/branches" replace />;
  }

  return children;
}

export default ProtectedRoute;
