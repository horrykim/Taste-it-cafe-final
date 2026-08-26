import { adjustStock, getInventory } from "./mockInventoryService";

const STORAGE_KEY = "tasteit_reconciliations";
const allowedRoles = new Set(["OWNER", "STAFF"]);

const seedRecords = {
  babag: [{ id: "REC-BAB-001", branchId: "babag", performedBy: { id: "owner-1", name: "Maria Santos", role: "OWNER" }, createdAt: "2026-08-18T16:20:00.000Z", status: "COMPLETED", adjustmentStatus: "APPLIED", adjustedAt: "2026-08-18T16:28:00.000Z", adjustedBy: { id: "owner-1", name: "Maria Santos" }, reason: "Routine weekly count.", items: [
    { ingredientId: "bab-egg", name: "Egg", unit: "pc", systemQuantity: 160, physicalQuantity: 156, variance: -4, note: "Miscount" },
    { ingredientId: "bab-bun", name: "Burger Bun", unit: "pc", systemQuantity: 12, physicalQuantity: 12, variance: 0, note: "" },
    { ingredientId: "bab-cooking-oil", name: "Cooking Oil", unit: "ml", systemQuantity: 1800, physicalQuantity: 1750, variance: -50, note: "Damaged" },
  ] }],
  marigondon: [{ id: "REC-MAR-001", branchId: "marigondon", performedBy: { id: "staff-1", name: "Jordan Reyes", role: "STAFF" }, createdAt: "2026-08-18T17:05:00.000Z", status: "COMPLETED", adjustmentStatus: "PENDING", reason: "Investigating miscount.", items: [
    { ingredientId: "mar-egg", name: "Egg", unit: "pc", systemQuantity: 90, physicalQuantity: 92, variance: 2, note: "Found extra" },
    { ingredientId: "mar-bun", name: "Burger Bun", unit: "pc", systemQuantity: 46, physicalQuantity: 46, variance: 0, note: "" },
    { ingredientId: "mar-fruit-tea", name: "Passion Fruit Syrup", unit: "ml", systemQuantity: 1000, physicalQuantity: 900, variance: -100, note: "Expired/old stock" },
  ] }],
};

function clone(value) { return structuredClone(value); }
function readRecords() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.babag && stored?.marigondon) return stored;
  } catch { /* use deterministic seed */ }
  const records = clone(seedRecords);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return records;
}
function writeRecords(records) { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function assertActor(actor) { if (!actor || !allowedRoles.has(actor.role)) throw new Error("You do not have permission to reconcile inventory."); }
function getBranchRecords(branchId) {
  const records = readRecords();
  if (!records[branchId]) throw new Error("Reconciliation data is unavailable for this branch.");
  return { records, branchRecords: records[branchId] };
}
function getRecord(branchId, id) {
  const { records, branchRecords } = getBranchRecords(branchId);
  const index = branchRecords.findIndex((record) => record.id === id);
  if (index < 0) throw new Error("Reconciliation record was not found for this branch.");
  return { records, branchRecords, index, record: branchRecords[index] };
}
function normaliseItems(items) {
  return items.map((item) => {
    const physicalQuantity = item.physicalQuantity === "" || item.physicalQuantity === null || item.physicalQuantity === undefined ? null : Number(item.physicalQuantity);
    if (physicalQuantity !== null && (!Number.isFinite(physicalQuantity) || physicalQuantity < 0)) throw new Error(`Enter a non-negative count for ${item.name}.`);
    const systemQuantity = Number(item.systemQuantity);
    return { ...item, systemQuantity, physicalQuantity, variance: physicalQuantity === null ? null : physicalQuantity - systemQuantity, note: item.note?.trim() ?? "" };
  });
}
function completeSummary(record) {
  const counted = record.items.filter((item) => item.physicalQuantity !== null);
  const varianceItems = counted.filter((item) => item.variance !== 0);
  return { itemCount: record.items.length, countedItems: counted.length, varianceItems: varianceItems.length, positiveItems: varianceItems.filter((item) => item.variance > 0).length, negativeItems: varianceItems.filter((item) => item.variance < 0).length };
}

export async function getReconciliations(branchId) {
  const { branchRecords } = getBranchRecords(branchId);
  return clone(branchRecords).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getInventorySnapshot(branchId) {
  const inventory = await getInventory(branchId);
  return inventory.filter((item) => item.active).map(({ id, name, unit, currentQuantity }) => ({ ingredientId: id, name, unit, systemQuantity: currentQuantity, physicalQuantity: null, variance: null, note: "" }));
}

export async function createReconciliation(branchId, user) {
  assertActor(user);
  const snapshot = await getInventorySnapshot(branchId);
  const { records, branchRecords } = getBranchRecords(branchId);
  const prefix = branchId === "babag" ? "BAB" : "MAR";
  const record = { id: `REC-${prefix}-${String(branchRecords.length + 1).padStart(3, "0")}`, branchId, performedBy: { id: user.id, name: user.name, role: user.role }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: "DRAFT", adjustmentStatus: "NOT_APPLICABLE", reason: "", items: snapshot };
  records[branchId].unshift(record);
  writeRecords(records);
  return clone(record);
}

export async function saveDraft(branchId, id, items, reason, user) {
  assertActor(user);
  const target = getRecord(branchId, id);
  if (target.record.status !== "DRAFT") throw new Error("Only draft reconciliations can be updated.");
  target.record.items = normaliseItems(items);
  target.record.reason = reason;
  target.record.updatedAt = new Date().toISOString();
  writeRecords(target.records);
  return clone(target.record);
}

export async function submitReconciliation(branchId, id, items, reason, user) {
  assertActor(user);
  const target = getRecord(branchId, id);
  if (target.record.status !== "DRAFT") throw new Error("This reconciliation has already been submitted.");
  
  if (!reason || reason.trim() === "") throw new Error("Please provide a reason or description for this reconciliation.");

  const countedItems = normaliseItems(items);
  if (countedItems.some((item) => item.physicalQuantity === null)) throw new Error("Count every inventory item before submitting this reconciliation.");
  
  target.record.items = countedItems;
  target.record.reason = reason;
  target.record.status = "COMPLETED";
  target.record.completedAt = new Date().toISOString();
  target.record.updatedAt = target.record.completedAt;
  target.record.adjustmentStatus = countedItems.some((item) => item.variance !== 0) ? "PENDING" : "NOT_REQUIRED";
  writeRecords(target.records);

  // If no adjustments are needed, automatically log the perfect matches to history
  if (target.record.adjustmentStatus === "NOT_REQUIRED") {
    for (const item of target.record.items) {
      await adjustStock(branchId, item.ingredientId, { type: "SET", amount: item.physicalQuantity, reason: target.record.reason || "Physical count discrepancy discovered during routine inventory reconciliation." }, { user, type: "Reconciliation", reference: id });
    }
  }

  return clone(target.record);
}

export async function applyAdjustment(branchId, id, user) {
  if (user?.role !== "OWNER") throw new Error("Only an Owner can apply a reconciliation inventory adjustment.");
  const target = getRecord(branchId, id);
  if (target.record.status !== "COMPLETED") throw new Error("Complete the reconciliation before applying an adjustment.");
  if (target.record.adjustmentStatus === "APPLIED") throw new Error("This adjustment has already been applied.");
  for (const item of target.record.items) {
    await adjustStock(branchId, item.ingredientId, { type: "SET", amount: item.physicalQuantity, reason: target.record.reason || "Physical count discrepancy discovered during routine inventory reconciliation." }, { user, type: "Reconciliation", reference: id });
  }
  target.record.adjustmentStatus = "APPLIED";
  target.record.adjustedAt = new Date().toISOString();
  target.record.adjustedBy = { id: user.id, name: user.name };
  target.record.updatedAt = target.record.adjustedAt;
  writeRecords(target.records);
  return clone(target.record);
}

export async function getReconciliationDetails(branchId, id) { return clone(getRecord(branchId, id).record); }
export function getReconciliationSummary(record) { return completeSummary(record); }
