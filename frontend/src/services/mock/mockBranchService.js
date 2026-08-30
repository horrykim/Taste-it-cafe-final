const STORAGE_KEY = "tasteit_branches";
const OWNER_ROLES = new Set(["OWNER"]);
const STAFF_STORAGE_KEY = "tasteit_staff";
const initialBranches = [
  { id: "babag", name: "Babag", code: "BA", address: "Babag, Lapu-Lapu City, Cebu", contactNumber: "+63 917 555 0101", email: "babag@tasteit.com", status: "ACTIVE", is_active: true, is_archived: false, createdAt: "2026-01-05T08:00:00.000Z", updatedAt: "2026-08-19T08:00:00.000Z" },
  { id: "marigondon", name: "Marigondon", code: "MAR", address: "Marigondon, Lapu-Lapu City, Cebu", contactNumber: "+63 917 555 0102", email: "marigondon@tasteit.com", status: "ACTIVE", is_active: true, is_archived: false, createdAt: "2026-01-06T08:00:00.000Z", updatedAt: "2026-08-19T08:00:00.000Z" },
];

function readState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch { /* initialize deterministic branch data */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBranches));
  return initialBranches;
}

let branchState = readState();
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(branchState)); }
function clone(value) { return structuredClone(value); }
function assertOwner(actorRole) { if (!OWNER_ROLES.has(actorRole)) throw new Error("Only the Owner can manage branches."); }
function hasActiveStaffAssigned(branchId) { try { const staff = JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY)) ?? []; return staff.some((record) => record.branchId === branchId && record.status === "ACTIVE"); } catch { return false; } }

function validateBranch(input, existingId = null) {
  const required = ["name", "code", "address", "contactNumber"];
  const missing = required.find((field) => !String(input[field] ?? "").trim());
  if (missing) throw new Error(`${missing === "contactNumber" ? "Contact number" : missing[0].toUpperCase() + missing.slice(1)} is required.`);
  const code = String(input.code).trim().toUpperCase();
  const duplicate = branchState.some((branch) => branch.id !== existingId && branch.code.toUpperCase() === code);
  if (duplicate) throw new Error("Branch code must be unique.");
  return { ...input, name: String(input.name).trim(), code, address: String(input.address).trim(), contactNumber: String(input.contactNumber).trim(), email: String(input.email ?? "").trim() };
}

export function getBranchRecords() { return clone(branchState); }
export async function getBranches({ actorRole } = {}) { assertOwner(actorRole); return clone(branchState); }
export async function saveBranch(input, { actorRole } = {}) {
  assertOwner(actorRole);
  const clean = validateBranch(input, input.id ?? null);
  const now = new Date().toISOString();
  if (input.id) {
    const index = branchState.findIndex((branch) => branch.id === input.id);
    if (index < 0) throw new Error("Branch was not found.");
    branchState[index] = { ...branchState[index], ...clean, updatedAt: now };
  } else {
    const idBase = clean.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "branch";
    let id = idBase;
    let suffix = 2;
    while (branchState.some((branch) => branch.id === id)) id = `${idBase}-${suffix++}`;
    branchState.push({ ...clean, id, status: "ACTIVE", is_active: true, is_archived: false, createdAt: now, updatedAt: now });
  }
  persist();
  return clone(branchState.find((branch) => branch.id === (input.id ?? branchState.at(-1).id)));
}
export async function setBranchStatus(branchId, status, { actorRole } = {}) {
  assertOwner(actorRole);
  if (!["ACTIVE", "DEACTIVATED", "ARCHIVED"].includes(status)) throw new Error("Invalid branch status.");
  const branch = branchState.find((entry) => entry.id === branchId);
  if (!branch) throw new Error("Branch was not found.");
  if (status !== "ACTIVE" && hasActiveStaffAssigned(branchId)) throw new Error("Reassign or deactivate active Staff accounts before changing this branch's status.");
  if (status !== "ACTIVE" && branchState.filter((entry) => entry.is_active && !entry.is_archived).length <= 1) throw new Error("At least one active branch must remain.");
  
  if (status === "ACTIVE") {
    branch.is_active = true;
    branch.is_archived = false;
  } else if (status === "DEACTIVATED") {
    branch.is_active = false;
    branch.is_archived = false;
  } else if (status === "ARCHIVED") {
    branch.is_active = false;
    branch.is_archived = true;
  }
  branch.status = status;
  branch.updatedAt = new Date().toISOString();
  persist();
  return clone(branch);
}
