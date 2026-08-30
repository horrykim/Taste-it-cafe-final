export function formatMovementType(type) {
  if (type === "sale") return "Sale";
  if (type === "reconciliation") return "Reconciliation";
  return "Inventory Activity";
}

export function buildInventoryHistoryReason(row) {
  const reconciliationLabel = row.inventory_reconciliations?.reconciliation_reasons?.label?.trim();
  const reconciliationOtherReason = row.inventory_reconciliations?.other_reason?.trim();
  const movementReason = row.reason?.trim();

  if (reconciliationOtherReason) {
    return reconciliationLabel && reconciliationLabel !== "Other"
      ? `${reconciliationLabel}: ${reconciliationOtherReason}`
      : reconciliationOtherReason;
  }

  if (reconciliationLabel) {
    return reconciliationLabel;
  }

  return movementReason || "";
}

export function mapInventoryHistoryRow(row) {
  const quantityBefore = Number(row.quantity_before ?? 0);
  const quantityAfter = Number(row.quantity_after ?? 0);
  const quantityChange = Number(row.quantity_change ?? quantityAfter - quantityBefore);

  return {
    id: row.id,
    itemId: row.inventory_item_id,
    branchId: row.branch_id,
    movementType: row.movement_type,
    type: formatMovementType(row.movement_type),
    quantityBefore,
    quantityAfter,
    quantityChange,
    variance: quantityChange,
    change: `${quantityBefore} -> ${quantityAfter}`,
    signedChange: `${quantityChange > 0 ? "+" : ""}${quantityChange}`,
    reason: buildInventoryHistoryReason(row),
    user: {
      id: row.performed_by,
      name: row.profiles?.full_name || "Unknown User",
      role: String(row.profiles?.role || "staff").toUpperCase(),
    },
    reconciliationId: row.reconciliation_id || null,
    saleId: row.sale_id || null,
    reference: row.reconciliation_id || row.sale_id || null,
    timestamp: row.created_at || new Date().toISOString(),
  };
}

export function getHistoryChangeTone(entry) {
  if (entry.quantityChange > 0) {
    return "positive";
  }
  if (entry.quantityChange < 0) {
    return "negative";
  }
  return "neutral";
}

export function hasMoreHistory(records, limit) {
  return records.length > limit;
}
