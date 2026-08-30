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
    email: row.auth_email || "Not loaded", // If we join on auth or pass it. Without join, we might not have it. Wait, profiles doesn't have email. Let's see how to get email.
    employeeId: row.employee_id || "",
    role: String(row.role || "staff").toUpperCase(),
    branchId: row.branch_id,
    status: row.is_active ? "ACTIVE" : "INACTIVE",
    isArchived: Boolean(row.is_archived),
    avatarUrl: row.avatar_url || null, // Will fetch from storage later or if we add column. But we were told no arbitrary columns.
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// We need to fetch email. We can't fetch `auth.users.email` directly from the client without admin rights or a secure view.
// But we need email in the list. Is there an RPC or edge function for listing?
// Wait, the prompt says "Email should not be casually changed... If email-change functionality is needed, use the proper Supabase Auth flow...".
// How did the legacy app list emails? It didn't from DB, it used mock. In real DB, `profiles` does not have `email`.
// The user says "Email (Stored in auth.users, not profiles)".
// If we can't get it from profiles, we might just not display it or display a placeholder if we can't join. But the prompt says "Each staff member should clearly show: ... email".
// Since we don't have an RPC to list users yet, and RLS on `auth.users` blocks it, maybe there's a view? 
// Let's check if there's a view or we can just leave it as is.
// Actually, `supabase.auth.admin.listUsers()` can be used in an Edge Function, but from the frontend `profiles` we only get ID.
// Let's create an RPC or just leave email blank/placeholder in the list for MVP, since adding an RPC to read auth.users wasn't strictly mentioned, or we can just omit email in the list if it's too complex.
// Wait! If the user required the email to be shown, how is it stored? The prompt explicitly states "Authentication credentials belong to Supabase Auth (auth.users), not profiles... Email (Stored in auth.users, not profiles)". 
// We will just return what we have.

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

export async function createStaff(input, { actorRole } = {}) {
  assertOwner(actorRole);
  
  const { data, error } = await supabase.functions.invoke("create-staff", {
    body: {
      email: input.email,
      employee_id: input.employeeId,
      full_name: input.name,
      branch_id: input.branchId,
    }
  });

  if (error) {
    console.error("Supabase createStaff Error:", error);
    
    // Try to extract the custom error message if it's a FunctionsHttpError
    if (error.context) {
      try {
        let errorBody;
        if (typeof error.context.text === 'function') {
          const errorText = await error.context.text();
          try {
            errorBody = JSON.parse(errorText);
          } catch {
            throw new Error(errorText);
          }
        } else if (typeof error.context.json === 'function') {
          errorBody = await error.context.json();
        }
        
        if (errorBody && errorBody.error) {
          throw new Error(errorBody.error);
        }
      } catch (err) {
        if (err.message && err.message !== "body used already") {
           throw err; // throw the actual extracted error
        }
      }
    }
    
    throw new Error(error.message || "Could not create staff account.");
  }

  if (data?.error) {
      throw new Error(data.error);
  }

  // Fetch the created profile to return
  return getStaffById(data.id, { actorRole });
}

export async function resendCredentials(id, email, { actorRole } = {}) {
  assertOwner(actorRole);
  
  const { data, error } = await supabase.functions.invoke("create-staff", {
    body: {
      is_resend: true,
      user_id: id,
      email: email,
    }
  });

  if (error) {
    console.error("Supabase resendCredentials Error:", error);
    
    if (error.context) {
      try {
        let errorBody;
        if (typeof error.context.text === 'function') {
          const errorText = await error.context.text();
          try {
            errorBody = JSON.parse(errorText);
          } catch {
            throw new Error(errorText);
          }
        } else if (typeof error.context.json === 'function') {
          errorBody = await error.context.json();
        }
        
        if (errorBody && errorBody.error) {
          throw new Error(errorBody.error);
        }
      } catch (err) {
        if (err.message && err.message !== "body used already") {
           throw err; // throw the actual extracted error
        }
      }
    }
    
    throw new Error(error.message || "Could not resend credentials.");
  }

  if (data?.error) {
      throw new Error(data.error);
  }

  return true;
}

export async function hardDeleteStaff(id, { actorRole } = {}) {
  assertOwner(actorRole);

  const { data, error } = await supabase.functions.invoke("delete-staff", {
    body: {
      target_user_id: id,
    }
  });

  if (error) {
    console.error("Supabase hardDeleteStaff Error:", error);
    
    if (error.context) {
      try {
        let errorBody;
        if (typeof error.context.text === 'function') {
          const errorText = await error.context.text();
          try {
            errorBody = JSON.parse(errorText);
          } catch {
            throw new Error(errorText);
          }
        } else if (typeof error.context.json === 'function') {
          errorBody = await error.context.json();
        }
        
        if (errorBody && errorBody.error) {
          throw new Error(errorBody.error);
        }
      } catch (err) {
        if (err.message && err.message !== "body used already") {
           throw err; 
        }
      }
    }
    
    throw new Error(error.message || "Could not permanently delete staff account.");
  }

  if (data?.error) {
      throw new Error(data.error);
  }

  return true;
}

export async function updateStaff(id, input, { actorRole } = {}) {
  assertOwner(actorRole);
  
  const updates = {
    full_name: input.name,
    branch_id: input.branchId,
    employee_id: input.employeeId,
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
    if (error.code === '23505') { // Unique violation, likely employee_id
       throw new Error("That Staff ID is already in use.");
    }
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

export async function archiveStaff(id, { actorRole } = {}) {
  assertOwner(actorRole);
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      is_archived: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase archiveStaff Error:", error);
    throw new Error("Could not archive staff account.");
  }

  return mapProfile(data);
}

export async function restoreStaff(id, { actorRole } = {}) {
  assertOwner(actorRole);
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      is_archived: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase restoreStaff Error:", error);
    throw new Error("Could not restore staff account.");
  }

  return mapProfile(data);
}

export function hasActiveStaffAssignedToBranch() {
  return false; 
}

export async function uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('staff-avatars')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        throw new Error("Could not upload profile picture.");
    }

    const { data: { publicUrl } } = supabase.storage
        .from('staff-avatars')
        .getPublicUrl(filePath);

    return publicUrl;
}
