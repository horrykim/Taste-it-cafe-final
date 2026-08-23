import { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import { getBranchRecords } from "../services/mock/mockBranchService";

const BRANCH_STORAGE_KEY = "tasteit_active_branch";
const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { currentUser } = useAuth();
  const [branches, setBranches] = useState(getBranchRecords);
  const [activeBranchId, setActiveBranchId] = useState(() => localStorage.getItem(BRANCH_STORAGE_KEY));

  const selectBranch = (branchId) => {
    if (currentUser?.role !== "OWNER" || !branches.some((branch) => branch.id === branchId && branch.status === "ACTIVE")) return;
    localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
    setActiveBranchId(branchId);
  };

  const refreshBranches = () => setBranches(getBranchRecords());

  const clearBranch = () => {
    localStorage.removeItem(BRANCH_STORAGE_KEY);
    setActiveBranchId(null);
  };

  const resolvedBranchId = currentUser?.role === "STAFF" ? currentUser.branchId : activeBranchId;
  const currentBranch = branches.find((branch) => branch.id === resolvedBranchId && branch.status === "ACTIVE") ?? null;
  const value = { branches, currentBranch, selectBranch, clearBranch, refreshBranches };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error("useBranch must be used within a BranchProvider.");
  return context;
}
