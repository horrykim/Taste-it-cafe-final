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
    address: row.address || "",
    phone: row.phone || "",
    status: row.is_active ? "ACTIVE" : "INACTIVE",
    managerId: row.manager_id,
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
    address: branch.address?.trim() || null,
    phone: branch.phone?.trim() || null,
    is_active: branch.status !== "INACTIVE",
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
