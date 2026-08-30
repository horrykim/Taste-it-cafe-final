export function normalizeCountInput(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

export function getCountVariance(systemQuantity, physicalQuantity) {
  if (physicalQuantity === null || Number.isNaN(physicalQuantity)) {
    return null;
  }
  return physicalQuantity - Number(systemQuantity);
}

export function getReconciliationStatus(event) {
  if (!event) return "pending";
  if (event.variance === 0) return "matched";
  return "discrepancy";
}

export function buildReasonText(reasonLabel, otherReason) {
  const label = reasonLabel?.trim() || "Other";
  const note = otherReason?.trim();
  return note ? `${label}: ${note}` : label;
}

export function summarizeCountItems(items) {
  const counted = items.filter((item) => item.physicalQuantity !== null && item.physicalQuantity !== "");
  return {
    total: items.length,
    counted: counted.length,
    matched: counted.filter((item) => item.variance === 0).length,
    shortages: counted.filter((item) => item.variance < 0).length,
    excesses: counted.filter((item) => item.variance > 0).length,
  };
}

export function summarizeReconciliationRecords(records) {
  return records.reduce(
    (summary, record) => {
      summary.totalRecords += 1;
      if (record.variance === 0) {
        summary.matched += 1;
      } else if (record.variance > 0) {
        summary.excesses += 1;
      } else {
        summary.shortages += 1;
      }
      return summary;
    },
    {
      totalRecords: 0,
      matched: 0,
      shortages: 0,
      excesses: 0,
    }
  );
}

export function buildReconciliationDraftItems(inventory, scopeType = "full", selectedItemIds = []) {
  const selectedSet = new Set(selectedItemIds);

  return inventory
    .filter((item) => item.active)
    .filter((item) => scopeType !== "targeted" || selectedSet.has(item.id))
    .map(({ id, name, unit, category, currentQuantity }) => ({
      ingredientId: id,
      name,
      unit,
      category,
      systemQuantity: currentQuantity,
      physicalQuantity: null,
      variance: null,
      overrideReasonId: "",
      overrideReasonType: "",
      overrideReasonLabel: "",
      overrideOtherReason: "",
    }));
}

export function resolveReconciliationReason(item, reason) {
  const effectiveReasonType = item.overrideReasonType || reason.reasonType;
  const effectiveOtherReason =
    effectiveReasonType === "other"
      ? (item.overrideOtherReason?.trim() || reason.otherReason?.trim() || "")
      : "";

  return {
    reasonType: effectiveReasonType,
    otherReason: effectiveOtherReason,
  };
}

export function parseSelectedInventoryItems(value) {
  if (!value) {
    return [];
  }

  return [...new Set(value.split(",").map((entry) => entry.trim()).filter(Boolean))];
}
