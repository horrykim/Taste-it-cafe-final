import { getBranchRecords } from "./mockBranchService";
import { getInventory } from "./mockInventoryService";
import { getMockMenuData } from "./mockMenuService";

const SALES_STORAGE_KEY = "tasteit_sales";
const clone = (value) => structuredClone(value);
const readSales = () => { try { return JSON.parse(localStorage.getItem(SALES_STORAGE_KEY)) ?? []; } catch { return []; } };
const dateOnly = (value) => { const date = new Date(value); return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); };
const branchLabel = (id, branches) => branches.find((branch) => branch.id === id)?.name ?? id;

function buildRange(period, from, to) {
  const now = new Date();
  const end = to ? new Date(`${to}T23:59:59`) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (period === "CUSTOM" && from) return { start: new Date(`${from}T00:00:00`), end };
  if (period === "TODAY") return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end };
  if (period === "WEEK") return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), end };
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
}

export async function getReportsData({ period = "MONTH", from = "", to = "", branchId = "ALL" } = {}) {
  const branches = getBranchRecords();
  const range = buildRange(period, from, to);
  const allSales = readSales().filter((transaction) => transaction.status === "COMPLETED");
  const transactions = allSales.filter((transaction) => {
    const created = new Date(transaction.createdAt);
    return (branchId === "ALL" || transaction.branchId === branchId) && created >= range.start && created <= range.end;
  });
  const branchData = await Promise.all(branches.map(async (branch) => {
    try { return { branch, menu: await getMockMenuData(branch.id), inventory: await getInventory(branch.id) }; }
    catch { return { branch, menu: { items: [], categories: [] }, inventory: [] }; }
  }));
  const menuLookup = new Map(branchData.flatMap(({ branch, menu }) => menu.items.map((item) => [`${branch.id}:${item.id}`, { ...item, categoryName: menu.categories.find((category) => category.id === item.categoryId)?.name ?? "Uncategorized" }])));
  const menuPerformanceMap = new Map();
  transactions.forEach((transaction) => transaction.items.forEach((line) => {
    const menu = menuLookup.get(`${transaction.branchId}:${line.menuItemId}`);
    const key = `${transaction.branchId}:${line.menuItemId}`;
    const current = menuPerformanceMap.get(key) ?? { id: key, item: line.name, category: menu?.categoryName ?? "Uncategorized", quantitySold: 0, salesAmount: 0, unitPrice: line.unitPrice, status: menu?.status ?? "ACTIVE" };
    current.quantitySold += line.quantity; current.salesAmount += line.lineTotal; current.unitPrice = current.quantitySold ? current.salesAmount / current.quantitySold : current.unitPrice; menuPerformanceMap.set(key, current);
  }));
  const salesByDate = [...transactions.reduce((map, transaction) => { const key = dateOnly(transaction.createdAt); const current = map.get(key) ?? { date: new Date(key).toISOString(), transactions: 0, grossSales: 0, branchIds: new Set() }; current.transactions += 1; current.grossSales += transaction.total; current.branchIds.add(transaction.branchId); map.set(key, current); return map; }, new Map()).values()].sort((a, b) => new Date(a.date) - new Date(b.date)).map((entry) => ({ ...entry, branch: entry.branchIds.size === 1 ? branchLabel([...entry.branchIds][0], branches) : "Multiple branches" }));
  const branchComparison = branches.filter((branch) => branchId === "ALL" || branch.id === branchId).map((branch) => { const records = transactions.filter((transaction) => transaction.branchId === branch.id); const total = records.reduce((sum, transaction) => sum + transaction.total, 0); return { id: branch.id, name: branch.name, totalSales: total, transactions: records.length, averageTransaction: records.length ? total / records.length : 0 }; });
  const inventoryItems = branchData.filter(({ branch }) => branchId === "ALL" || branch.id === branchId).flatMap(({ branch, inventory }) => inventory.map((item) => ({ ...item, branchName: branch.name })));
  const completedSales = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  return clone({ range: { from: range.start.toISOString(), to: range.end.toISOString() }, transactions, salesByDate, menuPerformance: [...menuPerformanceMap.values()].sort((a, b) => b.salesAmount - a.salesAmount), branchComparison, inventorySummary: { totalItems: inventoryItems.length, lowStock: inventoryItems.filter((item) => item.status === "low-stock").length, outOfStock: inventoryItems.filter((item) => item.status === "out-of-stock").length, inventoryValue: inventoryItems.reduce((sum, item) => sum + item.currentQuantity * item.costPerUnit, 0), items: inventoryItems }, summary: { totalSales: completedSales, transactions: transactions.length, averageTransaction: transactions.length ? completedSales / transactions.length : 0, topItem: [...menuPerformanceMap.values()].sort((a, b) => b.quantitySold - a.quantitySold)[0]?.item ?? "No sales yet" }, branches });
}
