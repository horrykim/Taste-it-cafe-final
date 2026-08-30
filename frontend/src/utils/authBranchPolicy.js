function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}



export function normalizeRole(value) {
  const normalized = toText(value).toUpperCase().replace(/[\s/_-]+/g, "");
  if (normalized === "OWNER" || normalized === "MANAGER" || normalized === "OWNERMANAGER") {
    return "OWNER";
  }
  if (normalized === "STAFF") {
    return "STAFF";
  }
  return null;
}

export function getActiveFlag(record) {
  if (!record || typeof record !== "object") {
    return false;
  }

  const booleanKeys = ["is_active", "active", "enabled"];
  for (const key of booleanKeys) {
    if (typeof record[key] === "boolean") {
      return record[key];
    }
  }

  const status = toText(record.status).toUpperCase();
  if (status) {
    return !["INACTIVE", "DISABLED", "ARCHIVED"].includes(status);
  }

  return false;
}

export function normalizeProfile(profile, authUser) {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const firstName = toText(profile.first_name);
  const lastName = toText(profile.last_name);
  const derivedName = [firstName, lastName].filter(Boolean).join(" ");
  const role = normalizeRole(profile.role ?? profile.user_role ?? profile.app_role);
  const active = getActiveFlag(profile);

  return {
    id: profile.id ?? authUser?.id ?? null,
    authUserId: authUser?.id ?? profile.id ?? null,
    email: toText(profile.email) || toText(authUser?.email) || "",
    name:
      toText(profile.full_name) ||
      toText(profile.name) ||
      derivedName ||
      toText(authUser?.user_metadata?.full_name) ||
      toText(authUser?.user_metadata?.name) ||
      toText(authUser?.email) ||
      "Taste It User",
    role,
    status: active ? "ACTIVE" : "INACTIVE",
    isActive: active,
    branchDatabaseId: profile.branch_id ?? profile.branchId ?? null,
    branchId: profile.branch_id ?? profile.branchId ?? null,
    phone:
      toText(profile.phone) ||
      toText(profile.phone_number) ||
      toText(profile.contact_number) ||
      "",
    rawProfile: profile,
  };
}

export function normalizeBranch(branch) {
  if (!branch || typeof branch !== "object") {
    return null;
  }

  const active = getActiveFlag(branch);
  const databaseId = branch.id ?? branch.branch_id ?? null;
  const name = toText(branch.name) || toText(branch.branch_name) || "Branch";

  return {
    id: String(databaseId),
    databaseId,
    name,
    code: toText(branch.code) || toText(branch.branch_code),
    address: toText(branch.address) || toText(branch.location),
    location: toText(branch.location) || toText(branch.address) || name,
    contactNumber: toText(branch.contact_number) || toText(branch.contactNumber),
    email: toText(branch.email),
    status: active ? "ACTIVE" : "INACTIVE",
    isActive: active,
    rawBranch: branch,
  };
}

export function resolveStoredBranch(branches, storedValue) {
  if (!storedValue) {
    return null;
  }

  return (
    branches.find((branch) => branch.databaseId === storedValue) ??
    branches.find((branch) => branch.id === storedValue) ??
    null
  );
}

export function resolveCurrentBranch(currentUser, branches, storedValue) {
  if (!currentUser) {
    return null;
  }

  if (currentUser.role === "STAFF") {
    return (
      branches.find((branch) => branch.databaseId === currentUser.branchDatabaseId) ??
      branches.find((branch) => branch.id === currentUser.branchId) ??
      null
    );
  }

  const selected = resolveStoredBranch(branches, storedValue);
  return selected?.isActive ? selected : null;
}

export function canSelectOwnerBranch(currentUser, branch) {
  return Boolean(currentUser?.role === "OWNER" && branch?.isActive);
}

export function applyRuntimeBranchToUser(currentUser, branch) {
  if (!currentUser || currentUser.role !== "STAFF") {
    return currentUser;
  }

  return {
    ...currentUser,
    branchId: branch?.id ?? null,
  };
}
