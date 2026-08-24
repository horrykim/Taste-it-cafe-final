import { adjustStock, getInventory } from "./mockInventoryService";
import { getMockMenuData } from "./mockMenuService";

const STORAGE_KEY = "tasteit_sales";
const roles = new Set(["OWNER", "STAFF"]);
function readSales() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; } catch { return []; } }
function writeSales(sales) { localStorage.setItem(STORAGE_KEY, JSON.stringify(sales)); }
function assertUser(user, branchId) { if (!user || !roles.has(user.role) || (user.role === "STAFF" && user.branchId !== branchId)) throw new Error("You do not have permission to create a transaction for this branch."); }

export async function getPosTransactions(branchId, user) {
  assertUser(user, branchId);
  const transactions = readSales().filter((transaction) => transaction.branchId === branchId);
  return structuredClone(user.role === "STAFF" ? transactions.filter((transaction) => transaction.cashierId === user.id) : transactions);
}

export async function getPosCatalogData(branchId) {
  const [{ categories, items }, inventory] = await Promise.all([getMockMenuData(branchId), getInventory(branchId)]);
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const nextItems = items.map((item) => {
    const unavailableIngredient = (item.recipe ?? []).find((recipeEntry) => {
      const inventoryItem = inventoryById.get(recipeEntry.ingredientId);
      return !inventoryItem || inventoryItem.active === false || inventoryItem.currentQuantity < recipeEntry.quantity;
    });
    return {
      ...item,
      status: item.status === "ACTIVE" && !unavailableIngredient ? "ACTIVE" : "INACTIVE",
      available: item.status === "ACTIVE" && !unavailableIngredient,
      availabilityReason: unavailableIngredient ? `Insufficient ${inventoryById.get(unavailableIngredient.ingredientId)?.name ?? "recipe stock"}.` : null,
    };
  });
  return { categories, items: nextItems };
}

export async function createPosTransaction(branchId, cart, payment, user) {
  assertUser(user, branchId);
  if (!cart.length) throw new Error("Add at least one menu item before completing the sale.");
  if (!["CASH", "GCASH"].includes(payment.method)) throw new Error("Select a payment method.");
  if (payment.method === "GCASH" && !payment.reference?.trim()) throw new Error("Enter the GCash / E-wallet reference number.");
  const [{ items: menuItems }, inventory] = await Promise.all([getMockMenuData(branchId), getInventory(branchId)]);
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const deductions = new Map();
  const transactionItems = cart.map((line) => {
    const menu = menuItems.find((item) => item.id === line.menuItemId);
    if (!menu || menu.status !== "ACTIVE") throw new Error(`${line.name} is not currently available.`);
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error("Each cart quantity must be at least one.");
    for (const recipeEntry of menu.recipe ?? []) deductions.set(recipeEntry.ingredientId, (deductions.get(recipeEntry.ingredientId) ?? 0) + recipeEntry.quantity * line.quantity);
    return { menuItemId: menu.id, name: menu.name, quantity: line.quantity, unitPrice: menu.price, lineTotal: menu.price * line.quantity, recipeId: menu.recipeId ?? null };
  });
  const inventoryDeductions = [...deductions.entries()].map(([ingredientId, quantity]) => ({ ingredientId, quantity, unit: inventoryById.get(ingredientId)?.unit ?? "" }));
  for (const deduction of inventoryDeductions) { const item = inventoryById.get(deduction.ingredientId); if (!item || item.currentQuantity < deduction.quantity) throw new Error(`Insufficient stock for ${item?.name ?? "a recipe ingredient"}.`); }
  for (const deduction of inventoryDeductions) await adjustStock(branchId, deduction.ingredientId, { type: "REMOVE", amount: deduction.quantity, reason: "Completed POS sale" }, { actorRole: user.role });
  const sales = readSales(); const prefix = branchId === "babag" ? "BA" : "MAR"; const branchCount = sales.filter((sale) => sale.branchId === branchId).length + 1;
  const subtotal = transactionItems.reduce((total, item) => total + item.lineTotal, 0);
  const transaction = { id: `sale-${branchId}-${branchCount}`, transactionId: `POS-${prefix}-${String(branchCount).padStart(4, "0")}`, branchId, cashierId: user.id, cashierName: user.name, createdAt: new Date().toISOString(), items: transactionItems, subtotal, total: subtotal, paymentMethod: payment.method, paymentReference: payment.method === "GCASH" ? payment.reference.trim() : null, inventoryDeductions, status: "COMPLETED" };
  sales.unshift(transaction); writeSales(sales); return structuredClone(transaction);
}
