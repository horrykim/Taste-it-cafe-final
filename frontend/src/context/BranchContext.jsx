import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../services/supabase";
import {
  applyRuntimeBranchToUser,
  canSelectOwnerBranch,
  normalizeBranch,
  resolveCurrentBranch,
  resolveStoredBranch,
} from "../utils/authBranchPolicy";

const BRANCH_STORAGE_KEY = "tasteit_active_branch";
const BranchContext = createContext(null);

function sortBranches(branches) {
  return [...branches].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
}

export function BranchProvider({ children }) {
  const { currentUser, isAuthenticated, isLoading: authLoading, profileState, syncRuntimeBranchId } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranchValue, setSelectedBranchValue] = useState(() => localStorage.getItem(BRANCH_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshBranches = async () => {
    if (!supabase || !isAuthenticated || !currentUser) {
      setBranches([]);
      setIsLoading(false);
      setError("");
      return [];
    }

    setIsLoading(true);
    setError("");

    const { data, error: branchError } = await supabase.from("branches").select("*");
    if (branchError) {
      setBranches([]);
      setError("We could not load the available branches.");
      setIsLoading(false);
      return [];
    }

    const normalized = sortBranches((data ?? []).map(normalizeBranch).filter(Boolean));
    setBranches(normalized);
    setIsLoading(false);
    return normalized;
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !currentUser || profileState !== "active") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranches([]);
      setIsLoading(false);
      setError("");
      return;
    }

    void refreshBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser?.authUserId, currentUser?.role, currentUser?.branchDatabaseId, isAuthenticated, profileState]);

  useEffect(() => {
    const currentBranch = resolveCurrentBranch(currentUser, branches, selectedBranchValue);
    const syncedUser = applyRuntimeBranchToUser(currentUser, currentBranch);
    if (syncedUser?.branchId !== currentUser?.branchId) {
      syncRuntimeBranchId(syncedUser.branchId);
    }
  }, [branches, currentUser, selectedBranchValue, syncRuntimeBranchId]);

  const selectBranch = (branchIdentifier) => {
    const branch =
      branches.find((entry) => entry.databaseId === branchIdentifier) ??
      branches.find((entry) => entry.id === branchIdentifier) ??
      null;

    if (!canSelectOwnerBranch(currentUser, branch)) {
      return;
    }

    localStorage.setItem(BRANCH_STORAGE_KEY, branch.databaseId);
    setSelectedBranchValue(branch.databaseId);
  };

  const clearBranch = () => {
    localStorage.removeItem(BRANCH_STORAGE_KEY);
    setSelectedBranchValue(null);
  };

  const storedBranch = resolveStoredBranch(branches, selectedBranchValue);
  const currentBranch = resolveCurrentBranch(currentUser, branches, storedBranch?.databaseId ?? selectedBranchValue);

  const value = {
    branches,
    currentBranch,
    selectBranch,
    clearBranch,
    refreshBranches,
    isLoading,
    error,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error("useBranch must be used within a BranchProvider.");
  return context;
}
