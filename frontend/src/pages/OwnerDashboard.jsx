import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function OwnerDashboard() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [dashboardMetrics, setDashboardMetrics] = useState({
    todaySales: 0,
    todayOrders: 0,
    averageOrderValue: 0,
    totalMenuItems: 0,
    availableMenuItems: 0,
    unavailableMenuItems: 0,
  });

  const [recentSales, setRecentSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // ========================================
      // LOAD DASHBOARD SUMMARY
      // Uses dashboard.js
      // ========================================

      const dashboardResponse = await api.get(
        "/dashboard/summary"
      );

      if (dashboardResponse.data?.success) {
        setDashboardMetrics(
          dashboardResponse.data.metrics || {
            todaySales: 0,
            todayOrders: 0,
            averageOrderValue: 0,
            totalMenuItems: 0,
            availableMenuItems: 0,
            unavailableMenuItems: 0,
          }
        );

        setRecentSales(
          Array.isArray(
            dashboardResponse.data.recentSales
          )
            ? dashboardResponse.data.recentSales
            : []
        );
      }

      // ========================================
      // LOAD MENU
      // ========================================

      const menuResponse = await api.get("/menu");

      setMenuItems(
        Array.isArray(menuResponse.data?.menuItems)
          ? menuResponse.data.menuItems
          : []
      );

      // ========================================
      // LOAD INVENTORY
      // ========================================

      const inventoryResponse = await api.get(
        "/inventory"
      );

      setInventory(
        Array.isArray(
          inventoryResponse.data?.inventory
        )
          ? inventoryResponse.data.inventory
          : []
      );
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ==========================================
  // DASHBOARD METRICS
  // ==========================================

  const todaySales = Number(
    dashboardMetrics.todaySales || 0
  );

  const todayOrders = Number(
    dashboardMetrics.todayOrders || 0
  );

  const averageOrderValue = Number(
    dashboardMetrics.averageOrderValue || 0
  );

  const totalMenuItems = Number(
    dashboardMetrics.totalMenuItems ??
      menuItems.length
  );

  const availableMenuItems = Number(
    dashboardMetrics.availableMenuItems ??
      menuItems.filter(
        (item) =>
          String(item.status).toLowerCase() ===
          "available"
      ).length
  );

  const unavailableMenuItems = Number(
    dashboardMetrics.unavailableMenuItems ??
      menuItems.filter(
        (item) =>
          String(item.status).toLowerCase() !==
          "available"
      ).length
  );

  // ==========================================
  // INVENTORY CALCULATIONS
  // ==========================================

  const totalInventoryItems = inventory.length;

  const lowStockItems = inventory.filter((item) => {
    const quantity = Number(item.quantity || 0);
    const lowStockLevel = Number(
      item.low_stock_level || 0
    );

    return quantity <= lowStockLevel;
  });

  const normalStockItems = inventory.filter((item) => {
    const quantity = Number(item.quantity || 0);
    const lowStockLevel = Number(
      item.low_stock_level || 0
    );

    return quantity > lowStockLevel;
  }).length;

  // ==========================================
  // TOTAL SALES RECORDS
  // ==========================================

  const totalSalesRecords = recentSales.length;

  // ==========================================
  // RECENT MENU ITEMS
  // ==========================================

  const recentMenuItems = [...menuItems]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);

      return dateB - dateA;
    })
    .slice(0, 5);

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatCurrency = (amount) => {
    return `₱${Number(amount || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ==========================================
  // FORMAT DATE + TIME
  // ==========================================

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ==========================================
  // GET TRANSACTION NUMBER
  // ==========================================

  const getTransactionNumber = (sale) => {
    return (
      sale.transaction_number ||
      sale.transactionNumber ||
      `Sale #${sale.id || "-"}`
    );
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>

              <p className="text-gray-500 mt-4">
                Loading dashboard...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <Sidebar />

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <main className="flex-1 p-8 overflow-auto">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard
            </h1>

            <p className="text-gray-500 mt-1">
              Welcome back! Here's what's happening
              at Taste It Café.
            </p>
          </div>

          <button
            onClick={() =>
              fetchDashboardData(true)
            }
            disabled={refreshing}
            className="px-5 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Dashboard"}
          </button>
        </div>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            <p className="font-semibold">
              Dashboard Error
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>

            <button
              onClick={() =>
                fetchDashboardData()
              }
              className="mt-3 text-sm font-semibold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ==========================================
            SALES STAT CARDS
        ========================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">

          {/* TODAY'S SALES */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Today's Sales
                </p>

                <h2 className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(todaySales)}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Total sales today
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                ₱
              </div>
            </div>
          </div>

          {/* TODAY'S ORDERS */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Today's Orders
                </p>

                <h2 className="text-3xl font-bold text-blue-600 mt-2">
                  {todayOrders}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Orders recorded today
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                🧾
              </div>
            </div>
          </div>

          {/* AVERAGE ORDER VALUE */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Average Order
                </p>

                <h2 className="text-3xl font-bold text-purple-600 mt-2">
                  {formatCurrency(averageOrderValue)}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Average order value today
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </div>

          {/* SALES RECORDS */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Recent Sales
                </p>

                <h2 className="text-3xl font-bold text-pink-600 mt-2">
                  {totalSalesRecords}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Latest recorded transactions
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            MENU + INVENTORY STAT CARDS
        ========================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          {/* TOTAL MENU */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Menu Items
                </p>

                <h2 className="text-3xl font-bold text-gray-800 mt-2">
                  {totalMenuItems}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Items in your menu
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-2xl">
                ☕
              </div>
            </div>
          </div>

          {/* AVAILABLE MENU */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Available Items
                </p>

                <h2 className="text-3xl font-bold text-green-600 mt-2">
                  {availableMenuItems}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Currently available
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                ✓
              </div>
            </div>
          </div>

          {/* INVENTORY */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Inventory Items
                </p>

                <h2 className="text-3xl font-bold text-blue-600 mt-2">
                  {totalInventoryItems}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Tracked inventory
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                📦
              </div>
            </div>
          </div>

          {/* LOW STOCK */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Low Stock
                </p>

                <h2
                  className={`text-3xl font-bold mt-2 ${
                    lowStockItems.length > 0
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {lowStockItems.length}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Need attention
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  lowStockItems.length > 0
                    ? "bg-red-100"
                    : "bg-green-100"
                }`}
              >
                ⚠
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            QUICK ACTIONS
        ========================================== */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-800">
              Quick Actions
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Quickly access important management
              functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* MENU */}

            <button
              onClick={() => navigate("/menu")}
              className="text-left p-5 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100 transition"
            >
              <div className="text-2xl mb-3">
                ☕
              </div>

              <h3 className="font-semibold text-gray-800">
                Manage Menu
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Add, edit, or remove menu items.
              </p>
            </button>

            {/* INVENTORY */}

            <button
              onClick={() =>
                navigate("/inventory")
              }
              className="text-left p-5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition"
            >
              <div className="text-2xl mb-3">
                📦
              </div>

              <h3 className="font-semibold text-gray-800">
                Manage Inventory
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Monitor ingredients and stock
                levels.
              </p>
            </button>

            {/* SALES */}

            <button
              onClick={() => navigate("/sales")}
              className="text-left p-5 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition"
            >
              <div className="text-2xl mb-3">
                💰
              </div>

              <h3 className="font-semibold text-gray-800">
                View Sales
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                View sales transactions and
                records.
              </p>
            </button>

            {/* REPORTS */}

            <button
              onClick={() =>
                navigate("/reports")
              }
              className="text-left p-5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition"
            >
              <div className="text-2xl mb-3">
                📊
              </div>

              <h3 className="font-semibold text-gray-800">
                View Reports
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Analyze sales and inventory
                performance.
              </p>
            </button>
          </div>
        </div>

        {/* ==========================================
            RECENT SALES + INVENTORY
        ========================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

          {/* ========================================
              RECENT SALES
          ======================================== */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Sales
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Latest recorded transactions.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate("/sales")
                }
                className="text-sm font-semibold text-pink-500 hover:text-pink-600"
              >
                View Sales →
              </button>
            </div>

            <div className="overflow-x-auto">

              {recentSales.length === 0 ? (
                <div className="text-center py-12 px-6">

                  <div className="text-4xl mb-3">
                    💰
                  </div>

                  <h3 className="font-semibold text-gray-700">
                    No sales recorded
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Sales transactions will appear
                    here.
                  </p>
                </div>
              ) : (
                <table className="w-full">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Transaction
                      </th>

                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Amount
                      </th>

                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">
                            {getTransactionNumber(
                              sale
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-4 font-semibold text-green-600">
                          {formatCurrency(
                            sale.total_amount
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(
                            sale.sale_date
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              )}
            </div>
          </div>

          {/* ========================================
              INVENTORY ALERTS
          ======================================== */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

            <div className="p-6 border-b border-gray-200 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Inventory Alerts
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Items that may need attention.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate("/inventory")
                }
                className="text-sm font-semibold text-pink-500 hover:text-pink-600"
              >
                View Inventory →
              </button>
            </div>

            <div className="p-6">

              {lowStockItems.length === 0 ? (
                <div className="text-center py-10">

                  <div className="text-4xl mb-3">
                    ✓
                  </div>

                  <h3 className="font-semibold text-gray-700">
                    Inventory looks good
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    No low-stock items at the
                    moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">

                  {lowStockItems
                    .slice(0, 5)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-red-50 border border-red-100"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.ingredient_name ||
                              "Unknown Ingredient"}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Branch:{" "}
                            {item.branch_name ||
                              "Unknown"}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">

                          <p className="font-bold text-red-600">
                            {Number(
                              item.quantity || 0
                            ).toFixed(2)}{" "}
                            {item.unit || ""}
                          </p>

                          <p className="text-xs text-gray-500">
                            Low level:{" "}
                            {Number(
                              item.low_stock_level || 0
                            ).toFixed(2)}
                          </p>

                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            MENU STATUS
        ========================================== */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Menu Status
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Current menu availability.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* AVAILABLE */}

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Available
                </span>

                <span className="text-sm font-semibold text-green-600">
                  {availableMenuItems}
                </span>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width:
                      totalMenuItems > 0
                        ? `${
                            (availableMenuItems /
                              totalMenuItems) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* UNAVAILABLE */}

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Unavailable
                </span>

                <span className="text-sm font-semibold text-red-500">
                  {unavailableMenuItems}
                </span>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{
                    width:
                      totalMenuItems > 0
                        ? `${
                            (unavailableMenuItems /
                              totalMenuItems) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* NORMAL STOCK */}

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Normal Stock
                </span>

                <span className="text-sm font-semibold text-blue-600">
                  {normalStockItems}
                </span>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width:
                      totalInventoryItems > 0
                        ? `${
                            (normalStockItems /
                              totalInventoryItems) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ==========================================
            RECENT MENU ITEMS
        ========================================== */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Menu Items
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Recently added menu items.
              </p>
            </div>

            <button
              onClick={() => navigate("/menu")}
              className="text-sm font-semibold text-pink-500 hover:text-pink-600"
            >
              Manage Menu →
            </button>

          </div>

          <div className="overflow-x-auto">

            {recentMenuItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  No menu items available.
                </p>
              </div>
            ) : (
              <table className="w-full">

                <thead className="bg-gray-50">
                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Item
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Category
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Price
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Added
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {recentMenuItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="px-6 py-4">

                        <p className="font-medium text-gray-800">
                          {item.item_name}
                        </p>

                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {item.description}
                          </p>
                        )}

                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {item.category || "-"}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-800">
                        {formatCurrency(item.price)}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            String(item.status).toLowerCase() ===
                            "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            )}

          </div>
        </div>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div className="mt-6 text-sm text-gray-400 text-center">
          Taste It Café Management System
        </div>

      </main>
    </div>
  );
}

export default OwnerDashboard;
