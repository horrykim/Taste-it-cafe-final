import { supabase } from "./supabase";
import { getInventoryStatus } from "../utils/inventoryStatus";
import { mapInventoryHistoryRow } from "../utils/inventoryHistory";

const ownerOnly = new Set(["OWNER"]);
const adjustmentRoles = new Set(["OWNER", "STAFF"]);

function assertRole(actorRole, allowedRoles) {
  if (!allowedRoles.has(actorRole)) {
    throw new Error("You do not have permission to perform this inventory action.");
  }
}

function withDerivedStatus(item) {
  return { ...item, status: getInventoryStatus(item) };
}

function mapInventoryRow(row) {
  const item = row.inventory_items || {};
  return {
    id: row.inventory_item_id || item.id,
    branchId: row.branch_id,
    name: item.name || "Unknown Item",
    category: item.inventory_categories?.name || "Uncategorized",
    unit: item.units?.abbreviation || item.units?.name || "unit",
    categoryId: item.category_id || "",
    unitId: item.base_unit_id || "",
    description: item.description || "",
    currentQuantity: Number(row.current_quantity ?? row.quantity ?? 0),
    lowStockThreshold: Number(row.low_stock_threshold ?? 0),
    lastUpdated: row.updated_at || row.last_updated || new Date().toISOString(),
    active: row.is_active ?? item.is_active ?? true,
  };
}

export async function getInventory(branchId) {
  if (!branchId) throw new Error("Branch ID is required.");

  const { data, error } = await supabase
    .from("branch_inventory")
    .select(`
      branch_id,
      inventory_item_id,
      current_quantity,
      low_stock_threshold,
      updated_at,
      inventory_items (
        id,
        name,
        category_id,
        base_unit_id,
        description,
        is_active,
        inventory_categories (name),
        units (name, abbreviation)
      )
    `)
    .eq("branch_id", branchId);

  if (error) {
    console.error("Supabase getInventory Error:", error);
    throw new Error("Could not fetch inventory.");
  }

  return (data || []).map(mapInventoryRow).map(withDerivedStatus);
}

export async function getInventoryItem(branchId, itemId) {
  if (!branchId || !itemId) throw new Error("Branch ID and Item ID are required.");

  const { data, error } = await supabase
    .from("branch_inventory")
    .select(`
      branch_id,
      inventory_item_id,
      current_quantity,
      low_stock_threshold,
      updated_at,
      inventory_items (
        id,
        name,
        category_id,
        base_unit_id,
        description,
        is_active,
        inventory_categories (name),
        units (name, abbreviation)
      )
    `)
    .eq("branch_id", branchId)
    .eq("inventory_item_id", itemId)
    .maybeSingle();

  if (error) {
    console.error("Supabase getInventoryItem Error:", error);
    throw new Error("Could not fetch inventory item.");
  }
  if (!data) throw new Error("Inventory item was not found for this branch.");

  return withDerivedStatus(mapInventoryRow(data));
}

// eslint-disable-next-line no-unused-vars
export async function getInventoryCategories(_branchId) {
  const { data, error } = await supabase.from("inventory_categories").select("id, name").order("name");
  if (error) {
    console.warn("Could not fetch inventory_categories", error);
    return [];
  }
  return data || [];
}

export async function getUnits() {
  const { data, error } = await supabase.from("units").select("id, name, abbreviation").order("name");
  if (error) {
    console.warn("Could not fetch units", error);
    return [];
  }
  return data || [];
}

export async function getReconciliationReasons() {
  const { data, error } = await supabase
    .from("reconciliation_reasons")
    .select("id, label, reason_type")
    .eq("is_active", true)
    .order("label");
  if (error) {
    console.warn("Could not fetch reconciliation_reasons", error);
    return [];
  }
  return data || [];
}

export async function getInventoryHistory(branchId, itemId) {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(`
      id,
      branch_id,
      inventory_item_id,
      movement_type,
      performed_by,
      quantity_before,
      quantity_after,
      quantity_change,
      reason,
      reconciliation_id,
      sale_id,
      created_at,
      profiles (full_name, role),
      inventory_reconciliations (
        other_reason,
        reconciliation_reasons (label, reason_type)
      )
    `)
    .eq("branch_id", branchId)
    .eq("inventory_item_id", itemId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase getInventoryHistory Error:", error);
    throw new Error("Could not fetch inventory history.");
  }
  return (data || []).map(mapInventoryHistoryRow);
}

export async function getAllBranchHistory(branchId) {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(`
      id,
      branch_id,
      inventory_item_id,
      movement_type,
      performed_by,
      quantity_before,
      quantity_after,
      quantity_change,
      reason,
      reconciliation_id,
      sale_id,
      created_at,
      profiles (full_name, role),
      inventory_reconciliations (
        other_reason,
        reconciliation_reasons (label, reason_type)
      )
    `)
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase getAllBranchHistory Error:", error);
    throw new Error("Could not fetch branch history.");
  }
  return (data || []).map(mapInventoryHistoryRow);
}

export async function updateStockThresholds(branchId, itemId, thresholds, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);

  const { data, error } = await supabase
    .from("branch_inventory")
    .update({
      low_stock_threshold: Number(thresholds.lowStockThreshold),
      updated_at: new Date().toISOString(),
    })
    .eq("branch_id", branchId)
    .eq("inventory_item_id", itemId)
    .select(`
      branch_id,
      inventory_item_id,
      current_quantity,
      low_stock_threshold,
      updated_at,
      inventory_items (
        id,
        name,
        category_id,
        base_unit_id,
        description,
        is_active,
        inventory_categories (name),
        units (name, abbreviation)
      )
    `)
    .maybeSingle();

  if (error) {
    console.error("Supabase updateStockThresholds Error:", error);
    throw new Error("Could not update stock thresholds.");
  }
  if (!data) throw new Error("Item not found to update.");

  return withDerivedStatus(mapInventoryRow(data));
}

export async function createInventoryItem(branchId, item, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);

  const { data: newItemId, error } = await supabase.rpc("create_inventory_item", {
    p_branch_id: branchId,
    p_name: item.name,
    p_category_id: item.categoryId,
    p_base_unit_id: item.unitId,
    p_description: item.description || null,
    p_initial_quantity: item.currentQuantity,
    p_low_stock_threshold: item.lowStockThreshold,
  });

  if (error) {
    console.error("Supabase RPC create_inventory_item Error:", error);
    throw new Error(`RPC Failed: ${error.message}`);
  }

  return getInventoryItem(branchId, newItemId);
}

export async function updateInventoryItem(branchId, itemId, updates, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);

  const { error } = await supabase.rpc("update_inventory_item", {
    p_inventory_item_id: itemId,
    p_name: updates.name,
    p_category_id: updates.categoryId,
    p_base_unit_id: updates.unitId,
    p_description: updates.description || null,
  });

  if (error) {
    console.error("Supabase RPC update_inventory_item Error:", error);
    throw new Error(`RPC Failed: ${error.message}`);
  }

  return getInventoryItem(branchId, itemId);
}

export async function deleteInventoryItem(branchId, itemId, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);

  const { error } = await supabase.rpc("deactivate_branch_inventory_item", {
    p_branch_id: branchId,
    p_inventory_item_id: itemId,
  });

  if (error) {
    console.error("Supabase RPC deactivate_branch_inventory_item Error:", error);
    throw new Error(`RPC Failed: ${error.message}`);
  }
}

export async function adjustStock(branchId, itemId, adjustment, { actorRole, user } = {}) {
  assertRole(actorRole || user?.role, adjustmentRoles);

  const { error } = await supabase.rpc("adjust_stock", {
    p_branch_id: branchId,
    p_inventory_item_id: itemId,
    p_user_id: user?.id,
    p_adjustment_type: adjustment.type,
    p_amount: adjustment.amount,
    p_reason_id: adjustment.reasonId,
    p_other_reason: adjustment.otherReason || null,
  });

  if (error) {
    console.error("Supabase RPC adjust_stock Error:", error);
    throw new Error(`RPC Failed: ${error.message}`);
  }

  return getInventoryItem(branchId, itemId);
}

export async function getRecipeIngredients(menuItemId, branchId) {
  throw new Error(
    `RPC Required: Fetching recipe ingredients securely requires a backend query to resolve current recipes for a given branch (Branch: ${branchId}, Menu Item: ${menuItemId}).`
  );
}

export async function saveRecipeIngredients(menuItemId, branchId, ingredients, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  throw new Error(
    `RPC Required: Saving recipe ingredients requires an atomic transaction (Branch: ${branchId}, Menu Item: ${menuItemId}, Ingredients: ${ingredients?.length}). Operation blocked.`
  );
}
