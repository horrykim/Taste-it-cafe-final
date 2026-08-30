import { supabase } from "./supabase";

export async function getDashboardData(branchId) {
  if (!branchId) throw new Error("Branch ID is required");

  // 1. Get today's start/end for queries
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  // 2. Fetch today's sales
  const { data: todaysSalesData, error: salesError } = await supabase
    .from("sales")
    .select(`
      id,
      transaction_number,
      total,
      payment_method,
      created_at,
      profiles (full_name),
      sale_items (quantity)
    `)
    .eq("branch_id", branchId)
    .eq("status", "completed")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)
    .order("created_at", { ascending: false });

  if (salesError) {
    console.error("Supabase Dashboard Sales Error:", salesError);
    throw new Error("Could not fetch today's sales.");
  }

  const transactions = todaysSalesData || [];
  const todaysSales = transactions.reduce((sum, t) => sum + Number(t.total), 0);
  const todaysTransactions = transactions.length;

  const recentTransactions = transactions.slice(0, 10).map((t) => {
    const timeString = new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const itemsCount = t.sale_items ? t.sale_items.reduce((acc, curr) => acc + Number(curr.quantity), 0) : 0;
    
    return {
      id: t.transaction_number,
      time: `Today, ${timeString}`,
      staffName: t.profiles?.full_name || "Unknown",
      items: `${itemsCount} item${itemsCount !== 1 ? 's' : ''}`,
      total: Number(t.total),
      paymentMethod: String(t.payment_method).charAt(0).toUpperCase() + String(t.payment_method).slice(1).toLowerCase(),
    };
  });

  // 3. Fetch inventory alerts (low stock)
  const { data: inventoryData, error: inventoryError } = await supabase
    .from("branch_inventory")
    .select(`
      current_quantity,
      low_stock_threshold,
      inventory_items (
        id,
        name,
        inventory_categories (name),
        units (name)
      )
    `)
    .eq("branch_id", branchId);

  if (inventoryError) {
    console.error("Supabase Dashboard Inventory Error:", inventoryError);
    throw new Error("Could not fetch inventory alerts.");
  }

  const inventoryAlerts = [];
  let lowStockItems = 0;
  let outOfStockItems = 0;

  (inventoryData || []).forEach((row) => {
    const item = row.inventory_items;
    if (!item) return;
    
    const qty = Number(row.current_quantity);
    const reorderLevel = Number(row.low_stock_threshold || 0);
    
    let status = null;
    if (qty === 0) {
      status = "out-of-stock";
      outOfStockItems++;
    } else if (qty <= reorderLevel) {
      status = "low-stock";
      lowStockItems++;
    }

    if (status) {
      inventoryAlerts.push({
        id: item.id,
        name: item.name,
        category: item.inventory_categories?.name || "Uncategorized",
        stock: qty.toString(),
        unit: item.units?.name || "unit",
        status,
      });
    }
  });

  // Sort inventory alerts: out of stock first, then by name
  inventoryAlerts.sort((a, b) => {
    if (a.status === "out-of-stock" && b.status !== "out-of-stock") return -1;
    if (b.status === "out-of-stock" && a.status !== "out-of-stock") return 1;
    return a.name.localeCompare(b.name);
  });

  // 4. Return data shape expected by the UI
  // Note: For 'sales' chart data, we mock it temporarily for the graph.
  // Full historical charting is handled in Reports.
  return {
    summary: { todaysSales, todaysTransactions, lowStockItems, outOfStockItems },
    recentTransactions,
    inventoryAlerts,
    sales: {
      daily: [
        { label: "8 AM", value: Math.floor(todaysSales * 0.1) },
        { label: "10 AM", value: Math.floor(todaysSales * 0.2) },
        { label: "12 PM", value: Math.floor(todaysSales * 0.3) },
        { label: "2 PM", value: Math.floor(todaysSales * 0.2) },
        { label: "4 PM", value: Math.floor(todaysSales * 0.1) },
        { label: "6 PM", value: Math.floor(todaysSales * 0.1) },
      ],
      weekly: [],
      monthly: []
    }
  };
}
