import { supabase } from "./supabase";

function assertOwner(actorRole) {
  if (!["owner", "OWNER"].includes(actorRole)) {
    throw new Error("Only the Owner can manage Branches.");
  }
}

// Maps DB branch to expected UI format
function mapBranch(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    address: row.address || "",
    contactNumber: row.contact_number || "",
    email: row.email || "",
    status: row.is_archived ? "ARCHIVED" : row.is_active ? "ACTIVE" : "DEACTIVATED",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBranches() {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .order("name");

  if (error) {
    console.error("Supabase getBranches Error:", error);
    throw new Error("Could not fetch branches.");
  }

  return (data || []).map(mapBranch);
}

export async function saveBranch(branch, { actorRole } = {}) {
  assertOwner(actorRole);

  const updates = {
    name: branch.name.trim(),
    code: branch.code.trim().toUpperCase(),
    address: branch.address?.trim() || null,
    contact_number: branch.contactNumber?.trim() || null,
    email: branch.email?.trim() || null,
    is_active: branch.status === "ACTIVE",
    is_archived: branch.status === "ARCHIVED",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("branches")
    .upsert(branch.id ? { id: branch.id, ...updates } : updates)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase saveBranch Error:", error);
    throw new Error("Could not save branch.");
  }
  
  return mapBranch(data);
}

export async function setBranchStatus(id, status, { actorRole } = {}) {
  assertOwner(actorRole);
  
  const { data, error } = await supabase
    .from("branches")
    .update({ 
      is_active: status === "ACTIVE",
      is_archived: status === "ARCHIVED",
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase setBranchStatus Error:", error);
    throw new Error("Could not update branch status.");
  }

  return mapBranch(data);
}
