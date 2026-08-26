import { getBranchRecords } from "./mockBranchService";

const STORAGE_KEY = "tasteit_staff";
const OWNER_ROLES = new Set(["OWNER"]);
const initialStaff = [
  { id: "staff-1", name: "Mia Santos", email: "staff@tasteit.com", password: "tasteit123", phone: "+63 917 555 0103", role: "STAFF", branchId: "marigondon", status: "ACTIVE", notes: "Marigondon branch staff.", createdAt: "2026-01-10T08:00:00.000Z", updatedAt: "2026-08-19T08:00:00.000Z" },
  { id: "staff-2", name: "Noel Garcia", email: "staff.babag@tasteit.com", password: "tasteit123", phone: "+63 917 555 0104", role: "STAFF", branchId: "babag", status: "ACTIVE", notes: "Babag branch staff.", createdAt: "2026-01-11T08:00:00.000Z", updatedAt: "2026-08-19T08:00:00.000Z" },
];

function clone(value) { return structuredClone(value); }
function readState() { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (Array.isArray(stored)) return stored; } catch { /* initialize deterministic staff data */ } localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStaff)); return initialStaff; }
let staffState = readState();
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(staffState)); }
function assertOwner(actorRole) { if (!OWNER_ROLES.has(actorRole)) throw new Error("Only the Owner can manage Staff accounts."); }
function activeBranches() { return new Map(getBranchRecords().filter((branch) => branch.status === "ACTIVE").map((branch) => [branch.id, branch])); }
function publicRecord(record) {
  const safeRecord = { ...record };
  delete safeRecord.password;
  return safeRecord;
}
function validate(record, existingId = null) {
  if (!String(record.name ?? "").trim()) throw new Error("Full name is required.");
  const email = String(record.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  if (staffState.some((staff) => staff.id !== existingId && staff.email.toLowerCase() === email)) throw new Error("Email address must be unique.");
  if (!record.branchId || !activeBranches().has(record.branchId)) throw new Error("Select an active branch.");
  return { ...record, name: String(record.name).trim(), email, phone: String(record.phone ?? "").trim(), notes: String(record.notes ?? "").trim(), role: "STAFF" };
}

export function getStaffRecords() { return staffState.map(publicRecord).map(clone); }
export async function listStaff({ actorRole } = {}) { assertOwner(actorRole); return clone(getStaffRecords()); }
export async function getStaffById(id, { actorRole } = {}) { assertOwner(actorRole); const record = staffState.find((staff) => staff.id === id); if (!record) throw new Error("Staff account was not found."); return clone(publicRecord(record)); }
export async function createStaff(input, { actorRole } = {}) {
  assertOwner(actorRole);
  const password = String(input.password ?? "");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  const clean = validate(input);
  const now = new Date().toISOString();
  const id = `staff-${Date.now()}`;
  const record = { ...clean, id, password, status: "ACTIVE", createdAt: now, updatedAt: now };
  staffState.push(record); persist(); return clone(publicRecord(record));
}
export async function updateStaff(id, input, { actorRole } = {}) {
  assertOwner(actorRole);
  const index = staffState.findIndex((staff) => staff.id === id);
  if (index < 0) throw new Error("Staff account was not found.");
  const { password, ...updates } = input;
  if (password && password.length < 6) throw new Error("New password must be at least 6 characters.");
  const clean = validate({ ...staffState[index], ...updates }, id);
  staffState[index] = { ...staffState[index], ...clean, ...(password ? { password } : {}), id, updatedAt: new Date().toISOString() };
  persist(); return clone(publicRecord(staffState[index]));
}
export async function updateStaffStatus(id, status, { actorRole } = {}) {
  assertOwner(actorRole);
  if (!["ACTIVE", "INACTIVE"].includes(status)) throw new Error("Invalid Staff account status.");
  const record = staffState.find((staff) => staff.id === id);
  if (!record) throw new Error("Staff account was not found.");
  record.status = status; record.updatedAt = new Date().toISOString(); persist(); return clone(publicRecord(record));
}
export function getStaffLoginRecord(email, password) {
  const record = staffState.find((staff) => staff.email.toLowerCase() === String(email).trim().toLowerCase() && staff.password === password);
  return record ? clone(record) : null;
}
export function hasActiveStaffAssignedToBranch(branchId) { return staffState.some((staff) => staff.branchId === branchId && staff.status === "ACTIVE"); }
