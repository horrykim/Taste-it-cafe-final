import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import AuthStateScreen, { AuthStateAction } from "./AuthStateScreen";

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireBranchForOwner,
}) {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    profileState,
    currentUser,
    error: authError,
    logout,
  } = useAuth();
  
  const { currentBranch, isLoading: isBranchLoading } = useBranch();

  if (isAuthLoading) {
    return <AuthStateScreen tone="loading" title="Loading..." description="Please wait while we verify your session." />;
  }

  if (profileState === "config-error") {
    return <AuthStateScreen tone="error" title="Configuration Error" description={authError} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (profileState === "missing") {
    return (
      <AuthStateScreen
        tone="missing"
        title="Profile Not Found"
        description={authError || "We could not find your profile."}
        action={<AuthStateAction label="Sign Out" onClick={logout} />}
      />
    );
  }

  if (profileState === "inactive") {
    return (
      <AuthStateScreen
        tone="inactive"
        title="Account Inactive"
        description="Your account is currently inactive. Please contact your administrator."
        action={<AuthStateAction label="Sign Out" onClick={logout} />}
      />
    );
  }

  if (profileState !== "active" || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <AuthStateScreen
        tone="error"
        title="Access Denied"
        description="You do not have permission to view this page."
        action={<AuthStateAction label="Go to Dashboard" onClick={() => window.location.href = "/"} />}
      />
    );
  }

  if (requireBranchForOwner && currentUser.role === "OWNER" && !currentBranch && !isBranchLoading) {
    return <Navigate to="/branches" replace />;
  }

  if (currentUser.role === "STAFF" && !currentBranch && !isBranchLoading) {
    return (
       <AuthStateScreen
        tone="error"
        title="Branch Assignment Missing"
        description="You are not assigned to an active branch."
        action={<AuthStateAction label="Sign Out" onClick={logout} />}
      />
    );
  }

  return children ? children : <Outlet />;
}
