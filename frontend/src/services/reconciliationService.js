import { supabase } from "./supabase";
import { getInventory } from "./inventoryService";
import { buildReconciliationDraftItems, resolveReconciliationReason } from "../utils/reconciliation";

const allowedRoles = new Set(["OWNER", "STAFF"]);

function assertActor(actor) {
  if (!actor || !allowedRoles.has(actor.role)) {
    throw new Error("You do not have permission to reconcile inventory.");
  }
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatReason(reasonLabel, otherReason) {
  const label = reasonLabel?.trim() || "Other";
  const note = otherReason?.trim();
  return note ? `${label}: ${note}` : label;
}

function mapReconciliationRow(row) {
  const reasonLabel = row.reconciliation_reasons?.label || "Other";
  const otherReason = row.other_reason || "";

  return {
    id: row.id,
    branchId: row.branch_id,
    inventoryItemId: row.inventory_item_id,
    itemName: row.inventory_items?.name || "Unknown Item",
    category: row.inventory_items?.inventory_categories?.name || "Uncategorized",
    unit:
      row.inventory_items?.units?.abbreviation ||
      row.inventory_items?.units?.name ||
      "unit",
    systemQuantity: asNumber(row.system_quantity),
    physicalQuantity: asNumber(row.physical_quantity),
    variance: asNumber(row.variance),
    reasonId: row.reason_id,
    reasonLabel,
    reasonType: row.reconciliation_reasons?.reason_type || "other",
    otherReason,
    reasonText: formatReason(reasonLabel, otherReason),
    createdAt: row.created_at,
    performedBy: {
      id: row.performed_by,
      name: row.profiles?.full_name || "Unknown",
      role: String(row.profiles?.role || "staff").toUpperCase(),
    },
  };
}

export async function getReconciliationRecords(branchId) {
  if (!branchId) {
    throw new Error("Branch ID is required.");
  }

  const { data, error } = await supabase
    .from("inventory_reconciliations")
    .select(`
      id,
      branch_id,
      inventory_item_id,
      performed_by,
      system_quantity,
      physical_quantity,
      variance,
      reason_id,
      other_reason,
      created_at,
      profiles (full_name, role),
      reconciliation_reasons (label, reason_type),
      inventory_items (
        name,
        inventory_categories (name),
        units (name, abbreviation)
      )
    `)
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase getReconciliationRecords Error:", error);
    throw new Error("Could not fetch reconciliation history.");
  }

  return (data || []).map(mapReconciliationRow);
}

export async function getInventorySnapshot(branchId, selectedItemIds = []) {
  const inventory = await getInventory(branchId);
  const scopeType = selectedItemIds.length > 0 ? "targeted" : "full";
  return buildReconciliationDraftItems(inventory, scopeType, selectedItemIds);
}

export async function createReconciliation(branchId, user, { scopeType = "full", selectedItemIds = [] } = {}) {
  assertActor(user);

  if (scopeType === "targeted" && selectedItemIds.length === 0) {
    throw new Error("Select at least one inventory item for a targeted reconciliation.");
  }

  const snapshot = await getInventorySnapshot(branchId, scopeType === "targeted" ? selectedItemIds : []);
  if (!snapshot.length) {
    throw new Error("No inventory items are available for this reconciliation.");
  }

  return {
    id: `draft-${scopeType}-${branchId}-${Date.now()}`,
    branchId,
    scopeType,
    performedBy: { id: user.id, name: user.name, role: user.role },
    createdAt: new Date().toISOString(),
    items: snapshot,
  };
}

export async function submitReconciliation(branchId, draft, reason, user) {
  assertActor(user);

  if (!branchId) {
    throw new Error("Branch ID is required.");
  }

  if (!draft?.scopeType) {
    throw new Error("Reconciliation scope is required.");
  }

  if (!reason?.reasonId) {
    throw new Error("Select a reconciliation reason.");
  }

  if (reason.reasonType === "other" && !reason.otherReason?.trim()) {
    throw new Error("Please specify the custom reconciliation reason.");
  }

  if (!Array.isArray(draft.items) || draft.items.length === 0) {
    throw new Error("No inventory items are available for this reconciliation.");
  }

  for (const item of draft.items) {
    const parsedQuantity =
      item.physicalQuantity === null || item.physicalQuantity === undefined || item.physicalQuantity === ""
        ? null
        : Number(item.physicalQuantity);

    if (parsedQuantity === null) {
      throw new Error(`Count every selected item before submitting. Missing count for ${item.name}.`);
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      throw new Error(`Enter a valid non-negative count for ${item.name}.`);
    }

    const { reasonType: effectiveReasonType, otherReason: effectiveOtherReason } =
      resolveReconciliationReason(item, reason);

    if (effectiveReasonType === "other" && !effectiveOtherReason) {
      throw new Error(`Please specify the custom reason for ${item.name}.`);
    }

    const { error } = await supabase.rpc("perform_inventory_reconciliation", {
      p_branch_id: branchId,
      p_inventory_item_id: item.ingredientId,
      p_physical_quantity: parsedQuantity,
      p_reason_type: effectiveReasonType,
      p_other_reason: effectiveOtherReason,
    });

    if (error) {
      console.error("Supabase perform_inventory_reconciliation Error:", error);
      throw new Error(`Failed to submit reconciliation: ${error.message}`);
    }
  }

  return {
    item_count: draft.items.length,
    scope_type: draft.scopeType,
  };
}

export async function getReconciliationRecord(branchId, reconciliationId) {
  const records = await getReconciliationRecords(branchId);
  const record = records.find((entry) => entry.id === reconciliationId);
  if (!record) {
    throw new Error("Reconciliation record was not found for this branch.");
  }
  return record;
}
