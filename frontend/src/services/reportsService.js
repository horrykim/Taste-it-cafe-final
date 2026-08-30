import { supabase } from "./supabase";
import { getInventory } from "./inventoryService";
import { getMenuData } from "./menuService";

const dateOnly = (value) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const branchLabel = (id, branches) =>
  branches.find((branch) => branch.id === id)?.name ?? id;

function buildRange(period, from, to) {
  const now = new Date();
  const end = to
    ? new Date(`${to}T23:59:59`)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  if (period === "CUSTOM" && from) return { start: new Date(`${from}T00:00:00`), end };
  if (period === "TODAY") return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end };
  if (period === "WEEK") return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), end };
  
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
}

export async function getReportsData({ period = "MONTH", from = "", to = "", branchId = "ALL" } = {}) {
  const range = buildRange(period, from, to);

  // Fetch branches
  const { data: branchesData } = await supabase.from("branches").select("*");
  const branches = branchesData || [];

  // Fetch Sales within range
  let salesQuery = supabase
    .from("sales")
    .select(`
      *,
      sale_items(*)
    `)
    .eq("status", "completed")
    .gte("created_at", range.start.toISOString())
    .lte("created_at", range.end.toISOString());

  if (branchId !== "ALL") {
    salesQuery = salesQuery.eq("branch_id", branchId);
  }

  const { data: transactionsData, error: salesError } = await salesQuery;
  
  if (salesError) {
    console.error("Supabase getReportsData Error:", salesError);
    throw new Error("Could not fetch reports data.");
  }
  const transactions = transactionsData || [];

  // Fetch Menu and Inventory per branch
  const branchData = await Promise.all(
    branches.map(async (branch) => {
      try {
        return {
          branch,
          menu: await getMenuData(branch.id),
          inventory: await getInventory(branch.id),
        };
      } catch {
        return { branch, menu: { items: [], categories: [] }, inventory: [] };
      }
    })
  );

  const menuLookup = new Map(
    branchData.flatMap(({ branch, menu }) =>
      menu.items.map((item) => [
        `${branch.id}:${item.id}`,
        {
          ...item,
          categoryName: menu.categories.find((c) => c.id === item.categoryId)?.name ?? "Uncategorized",
        },
      ])
    )
  );

  const menuPerformanceMap = new Map();
  transactions.forEach((transaction) => {
    (transaction.sale_items || []).forEach((line) => {
      const menu = menuLookup.get(`${transaction.branch_id}:${line.menu_item_id}`);
      const key = `${transaction.branch_id}:${line.menu_item_id}`;
      const lineQty = Number(line.quantity);
      const lineTotal = Number(line.line_total);

      const current = menuPerformanceMap.get(key) ?? {
        id: key,
        item: line.item_name_snapshot,
        category: menu?.categoryName ?? "Uncategorized",
        quantitySold: 0,
        salesAmount: 0,
        unitPrice: Number(line.unit_price_snapshot),
        status: menu?.status ?? "ACTIVE",
      };

      current.quantitySold += lineQty;
      current.salesAmount += lineTotal;
      current.unitPrice = current.quantitySold ? current.salesAmount / current.quantitySold : current.unitPrice;
      menuPerformanceMap.set(key, current);
    });
  });

  const salesByDate = [...transactions
    .reduce((map, transaction) => {
      const key = dateOnly(transaction.created_at);
      const current = map.get(key) ?? {
        date: new Date(key).toISOString(),
        transactions: 0,
        grossSales: 0,
        branchIds: new Set(),
      };
      current.transactions += 1;
      current.grossSales += Number(transaction.total);
      current.branchIds.add(transaction.branch_id);
      map.set(key, current);
      return map;
    }, new Map())
    .values()]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry) => ({
      ...entry,
      branch: entry.branchIds.size === 1 ? branchLabel([...entry.branchIds][0], branches) : "Multiple branches",
    }));

  const branchComparison = branches
    .filter((branch) => branchId === "ALL" || branch.id === branchId)
    .map((branch) => {
      const records = transactions.filter((t) => t.branch_id === branch.id);
      const total = records.reduce((sum, t) => sum + Number(t.total), 0);
      return {
        id: branch.id,
        name: branch.name,
        totalSales: total,
        transactions: records.length,
        averageTransaction: records.length ? total / records.length : 0,
      };
    });

  const inventoryItems = branchData
    .filter(({ branch }) => branchId === "ALL" || branch.id === branchId)
    .flatMap(({ branch, inventory }) =>
      inventory.map((item) => ({ ...item, branchName: branch.name }))
    );

  const completedSales = transactions.reduce((sum, t) => sum + Number(t.total), 0);
  const topItem = [...menuPerformanceMap.values()].sort((a, b) => b.quantitySold - a.quantitySold)[0]?.item ?? "No sales yet";

  return {
    range: { from: range.start.toISOString(), to: range.end.toISOString() },
    transactions,
    salesByDate,
    menuPerformance: [...menuPerformanceMap.values()].sort((a, b) => b.salesAmount - a.salesAmount),
    branchComparison,
    inventorySummary: {
      totalItems: inventoryItems.length,
      lowStock: inventoryItems.filter((item) => item.status === "low-stock").length,
      outOfStock: inventoryItems.filter((item) => item.status === "out-of-stock").length,
      inventoryValue: inventoryItems.reduce((sum, item) => sum + item.currentQuantity * (item.costPerUnit || 0), 0),
      items: inventoryItems,
    },
    summary: {
      totalSales: completedSales,
      transactions: transactions.length,
      averageTransaction: transactions.length ? completedSales / transactions.length : 0,
      topItem,
    },
    branches,
  };
}
