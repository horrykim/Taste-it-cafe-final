const dashboardDataByBranch = {
  babag: {
    summary: { todaysSales: 18450, todaysTransactions: 42, lowStockItems: 5, outOfStockItems: 1 },
    sales: {
      daily: [{ label: "8 AM", value: 1200 }, { label: "10 AM", value: 2450 }, { label: "12 PM", value: 3980 }, { label: "2 PM", value: 2860 }, { label: "4 PM", value: 3210 }, { label: "6 PM", value: 4750 }],
      weekly: [{ label: "Mon", value: 14800 }, { label: "Tue", value: 17200 }, { label: "Wed", value: 16100 }, { label: "Thu", value: 19500 }, { label: "Fri", value: 18450 }, { label: "Sat", value: 22100 }, { label: "Sun", value: 12600 }],
      monthly: [{ label: "Jan", value: 284000 }, { label: "Feb", value: 301500 }, { label: "Mar", value: 318200 }, { label: "Apr", value: 296800 }, { label: "May", value: 332400 }, { label: "Jun", value: 347600 }],
    },
    recentTransactions: [
      { id: "BAB-1042", time: "Today, 6:18 PM", staffName: "Noel Garcia", items: "2 items", total: 385, paymentMethod: "Cash" },
      { id: "BAB-1041", time: "Today, 5:52 PM", staffName: "Noel Garcia", items: "4 items", total: 720, paymentMethod: "GCash" },
      { id: "BAB-1040", time: "Today, 4:35 PM", staffName: "Noel Garcia", items: "1 item", total: 165, paymentMethod: "Cash" },
      { id: "BAB-1039", time: "Today, 3:47 PM", staffName: "Noel Garcia", items: "3 items", total: 540, paymentMethod: "Cash" },
    ],
    inventoryAlerts: [
      { id: "bab-milk", name: "Fresh milk", category: "Dairy", stock: "3.5", unit: "L", status: "low-stock" },
      { id: "bab-buns", name: "Burger buns", category: "Bakery", stock: "12", unit: "pcs", status: "low-stock" },
      { id: "bab-coffee", name: "Coffee beans", category: "Beverage", stock: "0", unit: "kg", status: "out-of-stock" },
    ],
  },
  marigondon: {
    summary: { todaysSales: 21380, todaysTransactions: 51, lowStockItems: 3, outOfStockItems: 0 },
    sales: {
      daily: [{ label: "8 AM", value: 1680 }, { label: "10 AM", value: 2940 }, { label: "12 PM", value: 4520 }, { label: "2 PM", value: 3480 }, { label: "4 PM", value: 3860 }, { label: "6 PM", value: 4900 }],
      weekly: [{ label: "Mon", value: 18300 }, { label: "Tue", value: 20100 }, { label: "Wed", value: 19450 }, { label: "Thu", value: 22600 }, { label: "Fri", value: 21380 }, { label: "Sat", value: 24800 }, { label: "Sun", value: 15700 }],
      monthly: [{ label: "Jan", value: 326000 }, { label: "Feb", value: 342500 }, { label: "Mar", value: 359800 }, { label: "Apr", value: 348200 }, { label: "May", value: 376400 }, { label: "Jun", value: 391700 }],
    },
    recentTransactions: [
      { id: "MAR-2087", time: "Today, 6:24 PM", staffName: "Mia Santos", items: "3 items", total: 575, paymentMethod: "GCash" },
      { id: "MAR-2086", time: "Today, 5:58 PM", staffName: "Mia Santos", items: "2 items", total: 340, paymentMethod: "Cash" },
      { id: "MAR-2085", time: "Today, 5:11 PM", staffName: "Mia Santos", items: "5 items", total: 940, paymentMethod: "Cash" },
      { id: "MAR-2084", time: "Today, 4:42 PM", staffName: "Mia Santos", items: "1 item", total: 180, paymentMethod: "GCash" },
    ],
    inventoryAlerts: [
      { id: "mar-cheese", name: "Cheese slices", category: "Dairy", stock: "18", unit: "pcs", status: "low-stock" },
      { id: "mar-lettuce", name: "Lettuce", category: "Produce", stock: "0.8", unit: "kg", status: "low-stock" },
    ],
  },
};

export async function getMockDashboardData(branchId) {
  const data = dashboardDataByBranch[branchId];
  if (!data) throw new Error("Dashboard data is unavailable for this branch.");
  return structuredClone(data);
}