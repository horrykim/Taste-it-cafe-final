import { supabase } from "./supabase";

const OWNER_ROLES = new Set(["owner", "OWNER"]);

function assertOwner(actorRole) {
  if (!OWNER_ROLES.has(actorRole)) {
    throw new Error("Only the Owner can manage Staff accounts.");
  }
}

// Maps DB profile to expected UI format
function mapProfile(row) {
  return {
    id: row.id,
    name: row.full_name || "Unknown",
    email: row.email || "N/A (Managed via Auth)", // UI expects email
    phone: row.phone || "N/A", // UI expects phone
    role: String(row.role || "staff").toUpperCase(),
    branchId: row.branch_id,
    status: row.is_active ? "ACTIVE" : "INACTIVE",
    notes: row.employee_id ? `Employee ID: ${row.employee_id}` : "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getStaffRecords() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "staff");

  if (error) {
    console.error("Supabase getStaffRecords Error:", error);
    throw new Error("Could not fetch staff records.");
  }

  return (data || []).map(mapProfile);
}

export async function listStaff({ actorRole } = {}) {
  assertOwner(actorRole);
  return getStaffRecords();
}

export async function getStaffById(id, { actorRole } = {}) {
  assertOwner(actorRole);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Supabase getStaffById Error:", error);
    throw new Error("Could not fetch staff account.");
  }
  if (!data) throw new Error("Staff account was not found.");

  return mapProfile(data);
}

export async function createStaff(_input, { actorRole } = {}) {
  assertOwner(actorRole);
  // Full staff creation requires creating an Auth user first (admin API)
  throw new Error("RPC/Admin Required: Creating a staff member securely requires Supabase Admin API to create the Auth user. Operation blocked.");
}

export async function updateStaff(id, input, { actorRole } = {}) {
  assertOwner(actorRole);
  
  const updates = {
    full_name: input.name,
    branch_id: input.branchId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase updateStaff Error:", error);
    throw new Error("Could not update staff account.");
  }
  
  return mapProfile(data);
}

export async function updateStaffStatus(id, status, { actorRole } = {}) {
  assertOwner(actorRole);
  if (!["ACTIVE", "INACTIVE"].includes(status)) throw new Error("Invalid Staff account status.");
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      is_active: status === "ACTIVE",
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase updateStaffStatus Error:", error);
    throw new Error("Could not update staff status.");
  }

  return mapProfile(data);
}

export function hasActiveStaffAssignedToBranch() {
  // Synchronous check is difficult without full state, returning false for now
  return false; 
}
