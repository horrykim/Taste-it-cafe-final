import { getMockMenuData } from "./mockMenuService";
import { getInventoryStatus } from "../../utils/inventoryStatus";

const initialInventoryByBranch = {
  babag: [
    { id: "bab-egg", branchId: "babag", name: "Egg", category: "Dairy", unit: "pc", currentQuantity: 156, lowStockThreshold: 36, targetStockLevel: 80, costPerUnit: 8, supplier: "Island Fresh", lastUpdated: "2026-08-19T08:15:00.000Z", active: true },
    { id: "bab-bun", branchId: "babag", name: "Burger Bun", category: "Bakery", unit: "pc", currentQuantity: 12, lowStockThreshold: 12, targetStockLevel: 48, costPerUnit: 9, supplier: "Daily Bake", lastUpdated: "2026-08-19T08:10:00.000Z", active: true },
    { id: "bab-beef-patty", branchId: "babag", name: "Beef Patty", category: "Meat", unit: "pc", currentQuantity: 48, lowStockThreshold: 15, targetStockLevel: 60, costPerUnit: 34, supplier: "Prime Cuts", lastUpdated: "2026-08-19T08:00:00.000Z", active: true },
    { id: "bab-chicken", branchId: "babag", name: "Chicken Fillet", category: "Meat", unit: "pc", currentQuantity: 35, lowStockThreshold: 10, targetStockLevel: 45, costPerUnit: 28, supplier: "Prime Cuts", lastUpdated: "2026-08-18T16:30:00.000Z", active: true },
    { id: "bab-cheese", branchId: "babag", name: "Cheese Slice", category: "Dairy", unit: "slice", currentQuantity: 8, lowStockThreshold: 10, targetStockLevel: 40, costPerUnit: 11, supplier: "Island Fresh", lastUpdated: "2026-08-19T08:05:00.000Z", active: true },
    { id: "bab-cooking-oil", branchId: "babag", name: "Cooking Oil", category: "Condiments", unit: "ml", currentQuantity: 1750, lowStockThreshold: 500, targetStockLevel: 3000, costPerUnit: 0.12, supplier: "Pantry Supply", lastUpdated: "2026-08-18T16:00:00.000Z", active: true },
    { id: "bab-coffee", branchId: "babag", name: "Espresso Beans", category: "Beverages", unit: "g", currentQuantity: 0, lowStockThreshold: 250, targetStockLevel: 1500, costPerUnit: 0.7, supplier: "Cebu Roasters", lastUpdated: "2026-08-19T07:45:00.000Z", active: true },
    { id: "bab-milk", branchId: "babag", name: "Fresh Milk", category: "Dairy", unit: "ml", currentQuantity: 3200, lowStockThreshold: 1000, targetStockLevel: 6000, costPerUnit: 0.08, supplier: "Island Fresh", lastUpdated: "2026-08-19T07:50:00.000Z", active: true },
    { id: "bab-ube", branchId: "babag", name: "Ube Filling", category: "Dry Goods", unit: "g", currentQuantity: 1200, lowStockThreshold: 300, targetStockLevel: 1800, costPerUnit: 0.22, supplier: "Pantry Supply", lastUpdated: "2026-08-18T15:30:00.000Z", active: true },
    { id: "bab-fries", branchId: "babag", name: "Potato Fries", category: "Dry Goods", unit: "g", currentQuantity: 2500, lowStockThreshold: 750, targetStockLevel: 4000, costPerUnit: 0.16, supplier: "Pantry Supply", lastUpdated: "2026-08-18T15:20:00.000Z", active: true },
  ],
  marigondon: [
    { id: "mar-egg", branchId: "marigondon", name: "Egg", category: "Dairy", unit: "pc", currentQuantity: 92, lowStockThreshold: 24, targetStockLevel: 72, costPerUnit: 8.5, supplier: "Island Fresh", lastUpdated: "2026-08-19T08:20:00.000Z", active: true },
    { id: "mar-bun", branchId: "marigondon", name: "Burger Bun", category: "Bakery", unit: "pc", currentQuantity: 46, lowStockThreshold: 10, targetStockLevel: 50, costPerUnit: 9, supplier: "Daily Bake", lastUpdated: "2026-08-19T08:12:00.000Z", active: true },
    { id: "mar-beef-patty", branchId: "marigondon", name: "Beef Patty", category: "Meat", unit: "pc", currentQuantity: 64, lowStockThreshold: 18, targetStockLevel: 70, costPerUnit: 35, supplier: "Prime Cuts", lastUpdated: "2026-08-19T08:00:00.000Z", active: true },
    { id: "mar-cheese", branchId: "marigondon", name: "Cheese Slice", category: "Dairy", unit: "slice", currentQuantity: 18, lowStockThreshold: 18, targetStockLevel: 48, costPerUnit: 11, supplier: "Island Fresh", lastUpdated: "2026-08-19T08:05:00.000Z", active: true },
    { id: "mar-cooking-oil", branchId: "marigondon", name: "Cooking Oil", category: "Condiments", unit: "ml", currentQuantity: 2400, lowStockThreshold: 600, targetStockLevel: 3500, costPerUnit: 0.12, supplier: "Pantry Supply", lastUpdated: "2026-08-18T16:00:00.000Z", active: true },
    { id: "mar-chicken", branchId: "marigondon", name: "Chicken Fillet", category: "Meat", unit: "pc", currentQuantity: 27, lowStockThreshold: 8, targetStockLevel: 40, costPerUnit: 29, supplier: "Prime Cuts", lastUpdated: "2026-08-18T16:30:00.000Z", active: true },
    { id: "mar-rice", branchId: "marigondon", name: "Cooked Rice", category: "Dry Goods", unit: "g", currentQuantity: 4200, lowStockThreshold: 1200, targetStockLevel: 6000, costPerUnit: 0.07, supplier: "Pantry Supply", lastUpdated: "2026-08-19T06:00:00.000Z", active: true },
    { id: "mar-brownie", branchId: "marigondon", name: "Brownie Mix", category: "Dry Goods", unit: "g", currentQuantity: 1800, lowStockThreshold: 500, targetStockLevel: 2500, costPerUnit: 0.2, supplier: "Pantry Supply", lastUpdated: "2026-08-18T15:00:00.000Z", active: true },
    { id: "mar-fruit-tea", branchId: "marigondon", name: "Passion Fruit Syrup", category: "Beverages", unit: "ml", currentQuantity: 900, lowStockThreshold: 300, targetStockLevel: 1500, costPerUnit: 0.18, supplier: "Cebu Syrups", lastUpdated: "2026-08-18T14:45:00.000Z", active: true },
    { id: "mar-tea", branchId: "marigondon", name: "Tea Concentrate", category: "Beverages", unit: "ml", currentQuantity: 1500, lowStockThreshold: 400, targetStockLevel: 2200, costPerUnit: 0.1, supplier: "Cebu Syrups", lastUpdated: "2026-08-18T14:40:00.000Z", active: true },
  ],
};

const INVENTORY_STORAGE_KEY = "tasteit_inventory";
const HISTORY_STORAGE_KEY = "tasteit_inventory_history";

function readInventoryState() {
  try {
    const stored = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY));
    if (stored?.babag && stored?.marigondon) return stored;
  } catch { /* initialize deterministic mock inventory */ }
  const inventory = structuredClone(initialInventoryByBranch);
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  return inventory;
}

function persistInventoryState() { localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryByBranch)); }

const initialHistoryByBranch = {
  babag: [
    { id: "HIS-BAB-001", itemId: "bab-egg", change: "21 → 20 pc", variance: -1, user: { id: "owner-1", name: "Alex Rivera", role: "OWNER" }, type: "Reconciliation", reason: "Physical count discrepancy discovered during routine inventory reconciliation.", reference: "REC-MAR-008", timestamp: "2026-08-27T00:30:00.000Z" },
    { id: "HIS-BAB-002", itemId: "bab-bun", change: "26 → 46 pc", variance: 20, user: { id: "staff-1", name: "John Cruz", role: "STAFF" }, type: "Restock", reason: "New delivery received from supplier.", reference: "RST-0008", timestamp: "2026-08-26T14:15:00.000Z" },
    { id: "HIS-BAB-003", itemId: "bab-cheese", change: "22 → 17 slice", variance: -5, user: { id: "staff-2", name: "Maria Santos", role: "STAFF" }, type: "Stock Adjustment", reason: "Damaged stock removed from inventory.", reference: "ADJ-0011", timestamp: "2026-08-26T10:05:00.000Z" },
    { id: "HIS-BAB-004", itemId: "bab-beef-patty", change: "34 → 64 pc", variance: 30, user: { id: "owner-1", name: "Alex Rivera", role: "OWNER" }, type: "Restock", reason: "Supplier delivery received.", reference: "RST-0007", timestamp: "2026-08-25T08:30:00.000Z" },
    { id: "HIS-BAB-005", itemId: "bab-chicken", change: "18 → 15 pc", variance: -3, user: { id: "staff-2", name: "Maria Santos", role: "STAFF" }, type: "Stock Adjustment", reason: "Spoiled stock removed from inventory.", reference: "ADJ-0010", timestamp: "2026-08-24T16:20:00.000Z" },
  ],
  marigondon: [
    { id: "HIS-MAR-001", itemId: "mar-cooking-oil", change: "1,200 → 2,376 ml", variance: 1176, user: { id: "owner-1", name: "Alex Rivera", role: "OWNER" }, type: "Restock", reason: "Monthly bulk restock.", reference: "RST-0006", timestamp: "2026-08-25T11:45:00.000Z" },
  ]
};

function readHistoryState() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY));
    if (stored?.babag && stored?.marigondon) return stored;
  } catch { /* ignore error */ }
  const history = structuredClone(initialHistoryByBranch);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  return history;
}

function persistHistoryState() { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyByBranch)); }

function logHistory(branchId, itemId, changeStr, variance, userOrRole, type, reason, reference) {
  if (!historyByBranch[branchId]) return;
  const user = typeof userOrRole === "string" 
    ? { id: "sys", name: userOrRole === "OWNER" ? "Owner/Manager" : "Staff Member", role: userOrRole }
    : (userOrRole || { id: "sys", name: "System", role: "SYSTEM" });
  historyByBranch[branchId].unshift({
    id: `HIS-${branchId === 'babag' ? 'BAB' : 'MAR'}-${Date.now().toString().slice(-6)}`,
    itemId,
    change: changeStr,
    variance: variance || 0,
    user,
    type,
    reason: reason || "",
    reference: reference || null,
    timestamp: new Date().toISOString()
  });
  persistHistoryState();
}

let inventoryByBranch = readInventoryState();
let historyByBranch = readHistoryState();
const recipeOverrides = {};
const ownerOnly = new Set(["OWNER"]);
const adjustmentRoles = new Set(["OWNER", "STAFF"]);

function assertRole(actorRole, allowedRoles) {
  if (!allowedRoles.has(actorRole)) throw new Error("You do not have permission to perform this inventory action.");
}

function getBranchInventory(branchId) {
  const inventory = inventoryByBranch[branchId];
  if (!inventory) throw new Error("Inventory data is unavailable for this branch.");
  return inventory;
}

function withDerivedStatus(item) {
  return { ...item, status: getInventoryStatus(item) };
}

function validateThresholds(lowStockThreshold, targetStockLevel) {
  if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) throw new Error("Low-stock threshold must be zero or greater.");
  if (!Number.isFinite(targetStockLevel) || targetStockLevel < lowStockThreshold) throw new Error("Target stock level must be at least the low-stock threshold.");
}

export async function getInventory(branchId) {
  return structuredClone(getBranchInventory(branchId).map(withDerivedStatus));
}

export async function getInventoryHistory(branchId, itemId) {
  return structuredClone(historyByBranch[branchId]?.filter(h => h.itemId === itemId) || []);
}

export async function getAllBranchHistory(branchId) {
  return structuredClone(historyByBranch[branchId] || []);
}

export async function getInventoryItem(branchId, itemId) {
  const item = getBranchInventory(branchId).find((entry) => entry.id === itemId);
  if (!item) throw new Error("Inventory item was not found for this branch.");
  return structuredClone(withDerivedStatus(item));
}

export async function getInventoryCategories(branchId) {
  return [...new Set(getBranchInventory(branchId).map((item) => item.category))].sort();
}

export async function createInventoryItem(branchId, item, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  validateThresholds(Number(item.lowStockThreshold), Number(item.targetStockLevel));
  if (!Number.isFinite(Number(item.currentQuantity ?? 0)) || Number(item.currentQuantity ?? 0) < 0) throw new Error("Current quantity must be zero or greater.");
  const inventory = getBranchInventory(branchId);
  const newItem = { ...item, id: item.id ?? `${branchId}-inventory-${inventory.length + 1}`, branchId, currentQuantity: Number(item.currentQuantity ?? 0), lowStockThreshold: Number(item.lowStockThreshold), targetStockLevel: Number(item.targetStockLevel), active: item.active ?? true, lastUpdated: new Date().toISOString() };
  inventory.push(newItem);
  persistInventoryState();
  logHistory(branchId, newItem.id, `Created item with initial stock of ${newItem.currentQuantity} ${newItem.unit}`, 0, actorRole, "Creation");
  return structuredClone(withDerivedStatus(newItem));
}

export async function updateInventoryItem(branchId, itemId, updates, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  const inventory = getBranchInventory(branchId);
  const index = inventory.findIndex((item) => item.id === itemId);
  if (index < 0) throw new Error("Inventory item was not found for this branch.");
  const next = { ...inventory[index], ...updates, branchId, currentQuantity: updates.currentQuantity === undefined ? inventory[index].currentQuantity : Number(updates.currentQuantity), lowStockThreshold: updates.lowStockThreshold === undefined ? inventory[index].lowStockThreshold : Number(updates.lowStockThreshold), targetStockLevel: updates.targetStockLevel === undefined ? inventory[index].targetStockLevel : Number(updates.targetStockLevel), lastUpdated: new Date().toISOString() };
  if (!Number.isFinite(next.currentQuantity) || next.currentQuantity < 0) throw new Error("Current quantity must be zero or greater.");
  validateThresholds(next.lowStockThreshold, next.targetStockLevel);
  inventory[index] = next;
  persistInventoryState();
  
  if (updates.active === false) {
    logHistory(branchId, itemId, "Deactivated item", 0, actorRole, "Status Change");
  } else if (updates.lowStockThreshold !== undefined || updates.targetStockLevel !== undefined) {
    logHistory(branchId, itemId, "Updated thresholds", 0, actorRole, "Configuration");
  } else {
    logHistory(branchId, itemId, "Edited item details", 0, actorRole, "Edit");
  }

  return structuredClone(withDerivedStatus(next));
}

export async function deleteInventoryItem(branchId, itemId, { actorRole } = {}) {
  return updateInventoryItem(branchId, itemId, { active: false }, { actorRole });
}

export async function adjustStock(branchId, itemId, adjustment, { actorRole, user, type, reference } = {}) {
  assertRole(actorRole || user?.role, adjustmentRoles);
  const item = getBranchInventory(branchId).find((entry) => entry.id === itemId);
  if (!item) throw new Error("Inventory item was not found for this branch.");
  const amount = Number(adjustment.amount);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Adjustment amount must be zero or greater.");
  if (!["ADD", "REMOVE", "SET"].includes(adjustment.type)) throw new Error("Adjustment type must be ADD, REMOVE, or SET.");
  if (adjustment.type === "REMOVE" && amount > item.currentQuantity) throw new Error("Cannot remove more stock than is currently available.");
  
  const oldQuantity = item.currentQuantity;
  item.currentQuantity = adjustment.type === "ADD" ? item.currentQuantity + amount : adjustment.type === "REMOVE" ? item.currentQuantity - amount : amount;
  item.lastUpdated = new Date().toISOString();
  persistInventoryState();
  
  const diff = item.currentQuantity - oldQuantity;
  const sign = diff > 0 ? "+" : diff < 0 ? "" : "";
  if (diff !== 0 || type === "Reconciliation") {
    logHistory(
      branchId, 
      itemId, 
      `${sign}${diff} ${item.unit}`, 
      diff, 
      user || actorRole, 
      type || "Stock Adjustment", 
      adjustment.reason || "Manual stock adjustment", 
      reference
    );
  }

  return structuredClone(withDerivedStatus(item));
}

export async function updateStockThresholds(branchId, itemId, thresholds, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  return updateInventoryItem(branchId, itemId, { lowStockThreshold: Number(thresholds.lowStockThreshold), targetStockLevel: Number(thresholds.targetStockLevel) }, { actorRole });
}

export async function getRecipeIngredients(menuItemId, branchId) {
  const menu = await getMockMenuData(branchId);
  const menuItem = menu.items.find((item) => item.id === menuItemId);
  if (!menuItem) throw new Error("Menu item was not found for this branch.");
  const recipe = recipeOverrides[branchId]?.[menuItemId] ?? menuItem.recipe ?? [];
  return structuredClone(recipe.map((entry, index) => ({ id: `${menuItemId}-ingredient-${index + 1}`, menuItemId, inventoryItemId: entry.inventoryItemId ?? entry.ingredientId, quantity: entry.quantity, unit: entry.unit })));
}

export async function saveRecipeIngredients(menuItemId, branchId, ingredients, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  const menu = await getMockMenuData(branchId);
  if (!menu.items.some((item) => item.id === menuItemId)) throw new Error("Menu item was not found for this branch.");
  const inventoryIds = new Set(getBranchInventory(branchId).map((item) => item.id));
  if (ingredients.some((entry) => !inventoryIds.has(entry.inventoryItemId) || !Number.isFinite(Number(entry.quantity)) || Number(entry.quantity) <= 0)) throw new Error("Recipe ingredients must belong to the active branch and have a positive quantity.");
  recipeOverrides[branchId] = { ...recipeOverrides[branchId], [menuItemId]: ingredients.map((entry, index) => ({ id: entry.id ?? `${menuItemId}-ingredient-${index + 1}`, menuItemId, inventoryItemId: entry.inventoryItemId, quantity: Number(entry.quantity), unit: entry.unit })) };
  return structuredClone(recipeOverrides[branchId][menuItemId]);
}
