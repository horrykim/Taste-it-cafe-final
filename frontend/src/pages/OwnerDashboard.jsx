import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function OwnerDashboard() {
  const navigate = useNavigate();

  // ======================================================
  // BRANCHES
  // ======================================================

  const branches = [
    {
      id: 0,
      branch_name: "All Branches",
      location: "Babag + Marigondon",
      isAll: true,
    },
    {
      id: 1,
      branch_name: "Babag Branch",
      location: "Babag, Lapu-Lapu City",
      isAll: false,
    },
    {
      id: 2,
      branch_name: "Marigondon Branch",
      location: "Marigondon, Lapu-Lapu City",
      isAll: false,
    },
  ];

  const actualBranches = branches.filter(
    (branch) => !branch.isAll
  );

  // ======================================================
  // SELECTED BRANCH
  // ======================================================

  const [selectedBranch, setSelectedBranch] = useState(
    branches[0]
  );

  // ======================================================
  // STATE
  // ======================================================

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

  const [currentUser, setCurrentUser] = useState(null);

  // ======================================================
  // STAFF FORM
  // ======================================================

  const [showStaffForm, setShowStaffForm] = useState(false);

  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    password: "",
    branch_id: 1,
  });

  const [staffLoading, setStaffLoading] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");
  const [staffError, setStaffError] = useState("");

  // ======================================================
  // LOAD CURRENT USER
  // ======================================================

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error(
          "Error loading current user:",
          error
        );
      }
    }
  }, []);

  // ======================================================
  // LOAD SAVED BRANCH
  // ======================================================

  useEffect(() => {
    const savedBranch = localStorage.getItem(
      "ownerSelectedBranch"
    );

    if (savedBranch) {
      try {
        const parsedBranch = JSON.parse(savedBranch);

        const branch = branches.find(
          (item) =>
            item.id === Number(parsedBranch.id)
        );

        if (branch) {
          setSelectedBranch(branch);
        }
      } catch (error) {
        console.error(
          "Error loading saved branch:",
          error
        );
      }
    }
  }, []);

  // ======================================================
  // FORCE STAFF TO ASSIGNED BRANCH
  // ======================================================

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === "cashier") {
      const staffBranch = actualBranches.find(
        (branch) =>
          branch.id === Number(
            currentUser.branch_id
          )
      );

      if (staffBranch) {
        setSelectedBranch(staffBranch);
      }
    }
  }, [currentUser]);

  // ======================================================
  // HANDLE BRANCH CHANGE
  // ======================================================

  const handleBranchChange = (e) => {
    const branchId = Number(e.target.value);

    const branch = branches.find(
      (item) => item.id === branchId
    );

    if (!branch) return;

    setSelectedBranch(branch);

    // Save owner's selected branch
    localStorage.setItem(
      "ownerSelectedBranch",
      JSON.stringify(branch)
    );

    console.log(
      "SELECTED BRANCH:",
      branch
    );
  };

  // ======================================================
  // FETCH SINGLE BRANCH DATA
  // ======================================================

  const fetchSingleBranchData = async (branch) => {
    const branchId = branch.id;

    const [
      dashboardResponse,
      menuResponse,
      inventoryResponse,
    ] = await Promise.all([
      api.get(
        `/dashboard/summary?branch_id=${branchId}`
      ),

      api.get(
        `/menu?branch_id=${branchId}`
      ),

      api.get(
        `/inventory?branch_id=${branchId}`
      ),
    ]);

    const dashboardData =
      dashboardResponse.data || {};

    const menuData =
      menuResponse.data || {};

    const inventoryData =
      inventoryResponse.data || {};

    return {
      branch,

      metrics:
        dashboardData.metrics || {
          todaySales: 0,
          todayOrders: 0,
          averageOrderValue: 0,
          totalMenuItems: 0,
          availableMenuItems: 0,
          unavailableMenuItems: 0,
        },

      recentSales:
        Array.isArray(
          dashboardData.recentSales
        )
          ? dashboardData.recentSales
          : [],

      menuItems:
        Array.isArray(menuData.menuItems)
          ? menuData.menuItems
          : [],

      inventory:
        Array.isArray(
          inventoryData.inventory
        )
          ? inventoryData.inventory
          : [],
    };
  };

  // ======================================================
  // FETCH DASHBOARD DATA
  // ======================================================

  const fetchDashboardData = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      console.log(
        "================================="
      );

      console.log(
        "LOADING OWNER DASHBOARD"
      );

      console.log(
        "Selected Branch:",
        selectedBranch.branch_name
      );

      // ==================================================
      // ALL BRANCHES
      // ==================================================

      if (selectedBranch.isAll) {
        console.log(
          "Loading ALL branch data..."
        );

        const branchResults =
          await Promise.all(
            actualBranches.map(
              (branch) =>
                fetchSingleBranchData(branch)
            )
          );

        // ================================================
        // COMBINE SALES
        // ================================================

        const combinedSales =
          branchResults
            .flatMap(
              (result) =>
                result.recentSales.map(
                  (sale) => ({
                    ...sale,

                    branch_id:
                      result.branch.id,

                    branch_name:
                      result.branch
                        .branch_name,
                  })
                )
            )
            .sort((a, b) => {
              const dateA =
                new Date(
                  a.sale_date || 0
                ).getTime();

              const dateB =
                new Date(
                  b.sale_date || 0
                ).getTime();

              return dateB - dateA;
            });

        // ================================================
        // COMBINE MENU
        // ================================================

        const combinedMenu =
          branchResults.flatMap(
            (result) =>
              result.menuItems.map(
                (item) => ({
                  ...item,

                  branch_id:
                    result.branch.id,

                  branch_name:
                    result.branch
                      .branch_name,
                })
              )
          );

        // ================================================
        // COMBINE INVENTORY
        // ================================================

        const combinedInventory =
          branchResults.flatMap(
            (result) =>
              result.inventory.map(
                (item) => ({
                  ...item,

                  branch_id:
                    result.branch.id,

                  branch_name:
                    item.branch_name ||
                    result.branch
                      .branch_name,
                })
              )
          );

        // ================================================
        // COMBINE METRICS
        // ================================================

        const totalTodaySales =
          branchResults.reduce(
            (total, result) =>
              total +
              Number(
                result.metrics
                  ?.todaySales || 0
              ),
            0
          );

        const totalTodayOrders =
          branchResults.reduce(
            (total, result) =>
              total +
              Number(
                result.metrics
                  ?.todayOrders || 0
              ),
            0
          );

        const totalMenuItems =
          combinedMenu.length;

        const availableMenuItems =
          combinedMenu.filter(
            (item) =>
              String(
                item.status
              ).toLowerCase() ===
              "available"
          ).length;

        const unavailableMenuItems =
          totalMenuItems -
          availableMenuItems;

        // Weighted average order value
        const combinedAverageOrder =
          totalTodayOrders > 0
            ? totalTodaySales /
              totalTodayOrders
            : 0;

        setDashboardMetrics({
          todaySales:
            totalTodaySales,

          todayOrders:
            totalTodayOrders,

          averageOrderValue:
            combinedAverageOrder,

          totalMenuItems,

          availableMenuItems,

          unavailableMenuItems,
        });

        setRecentSales(
          combinedSales.slice(0, 10)
        );

        setMenuItems(
          combinedMenu
        );

        setInventory(
          combinedInventory
        );

        console.log(
          "ALL BRANCH METRICS:",
          {
            totalTodaySales,
            totalTodayOrders,
            combinedAverageOrder,
            totalMenuItems,
            availableMenuItems,
            unavailableMenuItems,
          }
        );
      }

      // ==================================================
      // SINGLE BRANCH
      // ==================================================

      else {
        console.log(
          "Loading branch:",
          selectedBranch.branch_name
        );

        const result =
          await fetchSingleBranchData(
            selectedBranch
          );

        setDashboardMetrics(
          result.metrics
        );

        setRecentSales(
          result.recentSales
        );

        setMenuItems(
          result.menuItems
        );

        setInventory(
          result.inventory
        );
      }

      console.log(
        "Dashboard data loaded successfully."
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

  // ======================================================
  // LOAD DATA WHEN BRANCH CHANGES
  // ======================================================

  useEffect(() => {
    if (selectedBranch) {
      fetchDashboardData();
    }
  }, [selectedBranch.id]);

  // ======================================================
  // DASHBOARD METRICS
  // ======================================================

  const todaySales = Number(
    dashboardMetrics.todaySales || 0
  );

  const todayOrders = Number(
    dashboardMetrics.todayOrders || 0
  );

  const averageOrderValue = Number(
    dashboardMetrics.averageOrderValue ||
      0
  );

  const totalMenuItems = Number(
    dashboardMetrics.totalMenuItems ??
      menuItems.length
  );

  const availableMenuItems = Number(
    dashboardMetrics.availableMenuItems ??
      menuItems.filter(
        (item) =>
          String(
            item.status
          ).toLowerCase() ===
          "available"
      ).length
  );

  const unavailableMenuItems = Number(
    dashboardMetrics.unavailableMenuItems ??
      menuItems.filter(
        (item) =>
          String(
            item.status
          ).toLowerCase() !==
          "available"
      ).length
  );

  // ======================================================
  // INVENTORY CALCULATIONS
  // ======================================================

  const totalInventoryItems =
    inventory.length;

  const lowStockItems =
    inventory.filter((item) => {
      const quantity = Number(
        item.quantity || 0
      );

      const lowStockLevel =
        Number(
          item.low_stock_level || 0
        );

      return (
        quantity <= lowStockLevel
      );
    });

  const normalStockItems =
    inventory.filter((item) => {
      const quantity = Number(
        item.quantity || 0
      );

      const lowStockLevel =
        Number(
          item.low_stock_level || 0
        );

      return (
        quantity > lowStockLevel
      );
    }).length;

  // ======================================================
  // RECENT SALES COUNT
  // ======================================================

  const totalSalesRecords =
    recentSales.length;

  // ======================================================
  // RECENT MENU ITEMS
  // ======================================================

  const recentMenuItems =
    [...menuItems].sort(
      (a, b) => {
        const dateA =
          new Date(
            a.created_at || 0
          );

        const dateB =
          new Date(
            b.created_at || 0
          );

        return dateB - dateA;
      }
    );

  // ======================================================
  // FORMAT CURRENCY
  // ======================================================

  const formatCurrency = (amount) => {
    return `₱${Number(
      amount || 0
    ).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // ======================================================
  // FORMAT DATE + TIME
  // ======================================================

  const formatDateTime = (date) => {
    if (!date) return "-";

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // TRANSACTION NUMBER
  // ======================================================

  const getTransactionNumber = (
    sale
  ) => {
    return (
      sale.transaction_number ||
      sale.transactionNumber ||
      `Sale #${sale.id || "-"}`
    );
  };

  // ======================================================
  // CREATE STAFF
  // ======================================================

  const handleCreateStaff = async (e) => {
    e.preventDefault();

    setStaffLoading(true);
    setStaffMessage("");
    setStaffError("");

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setStaffError(
          "You are not logged in. Please log in again."
        );
        return;
      }

      const response =
        await api.post(
          "/auth/staff",
          {
            full_name:
              staffForm.full_name,

            email:
              staffForm.email,

            password:
              staffForm.password,

            branch_id: Number(
              staffForm.branch_id
            ),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (response.data?.success) {
        setStaffMessage(
          "Staff account created successfully!"
        );

        setStaffForm({
          full_name: "",
          email: "",
          password: "",
          branch_id:
            selectedBranch.isAll
              ? 1
              : selectedBranch.id,
        });
      }
    } catch (error) {
      console.error(
        "Create staff error:",
        error
      );

      setStaffError(
        error.response?.data
          ?.message ||
          "Failed to create staff account."
      );
    } finally {
      setStaffLoading(false);
    }
  };

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "ownerSelectedBranch"
    );

    localStorage.removeItem(
      "selectedBranch"
    );

    navigate("/");
  };

  // ======================================================
  // LOADING SCREEN
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">

        <div className="sticky top-0 h-screen self-start">
          <Sidebar />
        </div>

        <main className="flex-1 p-8">

          <div className="flex items-center justify-center min-h-[70vh]">

            <div className="text-center">

              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>

              <p className="text-gray-500 mt-4">
                Loading{" "}
                {selectedBranch.branch_name}{" "}
                dashboard...
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ======================================================
  // MAIN DASHBOARD
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <div className="sticky top-0 h-screen self-start">
        <Sidebar />
      </div>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="flex-1 p-8 overflow-x-hidden">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">

              {currentUser?.role ===
              "owner"
                ? "Owner Dashboard"
                : "Staff Dashboard"}

            </h1>

            <p className="text-gray-500 mt-1">

              Welcome back,{" "}
              {currentUser?.full_name ||
                "User"}!

              Here's what's happening at
              Taste It Café.

            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            {/* ==================================================
                BRANCH DROPDOWN
            ================================================== */}

            <div className="flex items-center gap-2">

              {currentUser?.role ===
              "owner" ? (

                <select
                  value={selectedBranch.id}
                  onChange={
                    handleBranchChange
                  }
                  className="px-4 py-3 bg-white border border-pink-300 rounded-lg text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                >

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.branch_name}
                      </option>
                    )
                  )}

                </select>

              ) : (

                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold">

                  📍{" "}
                  {
                    selectedBranch.branch_name
                  }

                </div>

              )}

            </div>

            {/* ==================================================
                NEW SALE
            ================================================== */}

            <button
              onClick={() =>
                navigate("/sales")
              }
              className="px-5 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              + New Sale
            </button>

            {/* ==================================================
                REFRESH
            ================================================== */}

            <button
              onClick={() =>
                fetchDashboardData(true)
              }
              disabled={refreshing}
              className="px-5 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

        </div>

        {/* ==================================================
            CURRENT BRANCH
        ================================================== */}

        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-5 mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div>

              <p className="text-sm text-gray-500">
                Currently viewing
              </p>

              <h2 className="text-xl font-bold text-gray-800 mt-1">
                📍{" "}
                {
                  selectedBranch.branch_name
                }
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {
                  selectedBranch.location
                }
              </p>

            </div>

            <div className="text-sm text-gray-500">

              {selectedBranch.isAll ? (
                <>
                  Combined Branches:{" "}
                  <span className="font-semibold text-gray-700">
                    2
                  </span>
                </>
              ) : (
                <>
                  Branch ID:{" "}
                  <span className="font-semibold text-gray-700">
                    {selectedBranch.id}
                  </span>
                </>
              )}

            </div>

          </div>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

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

        {/* ==================================================
            SALES STAT CARDS
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">

          {/* TODAY SALES */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

            <p className="text-sm text-gray-500">
              Today's Sales
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(
                todaySales
              )}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {selectedBranch.isAll
                ? "All Branches"
                : selectedBranch.branch_name}
            </p>

          </div>

          {/* TODAY ORDERS */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

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

          {/* AVERAGE ORDER */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

            <p className="text-sm text-gray-500">
              Average Order
            </p>

            <h2 className="text-3xl font-bold text-purple-600 mt-2">
              {formatCurrency(
                averageOrderValue
              )}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Average order value today
            </p>

          </div>

          {/* RECENT SALES */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

            <p className="text-sm text-gray-500">
              Recent Sales
            </p>

            <h2 className="text-3xl font-bold text-pink-600 mt-2">
              {totalSalesRecords}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Latest transactions
            </p>

          </div>

        </div>

        {/* ==================================================
            MENU + INVENTORY
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          {/* TOTAL MENU */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

            <p className="text-sm text-gray-500">
              Total Menu Items
            </p>

            <h2 className="text-3xl font-bold text-gray-800 mt-2">
              {totalMenuItems}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {selectedBranch.isAll
                ? "Combined menu items"
                : "Items in this branch"}
            </p>

          </div>

          {/* AVAILABLE */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

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

          {/* INVENTORY */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

            <p className="text-sm text-gray-500">
              Inventory Items
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {totalInventoryItems}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {selectedBranch.isAll
                ? "Combined inventory"
                : "Tracked inventory"}
            </p>

          </div>

          {/* LOW STOCK */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

            <p className="text-sm text-gray-500">
              Low Stock
            </p>

            <h2
              className={`text-3xl font-bold mt-2 ${
                lowStockItems.length >
                0
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

        </div>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-gray-800">
              Quick Actions
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage the selected branch.
            </p>

          </div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

            {/* MENU */}

            <button
              onClick={() =>
                navigate("/menu")
              }
              className="text-left p-5 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100 transition"
            >

              <div className="text-2xl mb-3">
                ☕
              </div>

              <h3 className="font-semibold text-gray-800">
                Manage Menu
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Add, edit, or remove menu
                items.
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

              {/* ==================================================
                  ADD INGREDIENT
              ================================================== */}

              <button
                onClick={() => navigate("/inventory")}
                className="text-left p-5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition"
              >
                <div className="text-2xl mb-3">
                  🥕
                </div>

                <h3 className="font-semibold text-gray-800">
                  Add Ingredient
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Add a new ingredient to inventory.
                </p>
              </button>

            {/* SALES */}

            <button
              onClick={() =>
                navigate("/sales")
              }
              className="text-left p-5 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition"
            >

              <div className="text-2xl mb-3">
                💰
              </div>

              <h3 className="font-semibold text-gray-800">
                New Sale / POS
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Create a customer order and
                record a sale.
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

        {/* ==================================================
            RECENT SALES + INVENTORY ALERTS
        ================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

          {/* ==================================================
              RECENT SALES
          ================================================== */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

            <div className="p-6 border-b border-gray-200 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Sales
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedBranch.isAll
                    ? "Latest transactions from all branches."
                    : `Latest ${selectedBranch.branch_name} transactions.`}
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

              {recentSales.length ===
              0 ? (

                <div className="text-center py-12 px-6">

                  <div className="text-4xl mb-3">
                    💰
                  </div>

                  <h3 className="font-semibold text-gray-700">
                    No sales recorded
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Sales transactions will
                    appear here.
                  </p>

                </div>

              ) : (

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Transaction
                      </th>

                      {selectedBranch.isAll && (
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                          Branch
                        </th>
                      )}

                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Amount
                      </th>

                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {recentSales.map(
                      (sale) => (
                        <tr
                          key={`${sale.branch_id}-${sale.id}`}
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">

                            <p className="font-medium text-gray-800">
                              {getTransactionNumber(
                                sale
                              )}
                            </p>

                          </td>

                          {selectedBranch.isAll && (
                            <td className="px-6 py-4">

                              <span className="px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">

                                {
                                  sale.branch_name
                                }

                              </span>

                            </td>
                          )}

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
                      )
                    )}

                  </tbody>

                </table>

              )}

            </div>

          </div>

          {/* ==================================================
              INVENTORY ALERTS
          ================================================== */}

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

              {lowStockItems.length ===
              0 ? (

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
                        key={`${item.branch_id}-${item.id}`}
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
                              selectedBranch.branch_name}

                          </p>

                        </div>

                        <div className="text-left sm:text-right">

                          <p className="font-bold text-red-600">

                            {Number(
                              item.quantity ||
                                0
                            ).toFixed(2)}{" "}

                            {item.unit || ""}

                          </p>

                          <p className="text-xs text-gray-500">

                            Low level:{" "}

                            {Number(
                              item.low_stock_level ||
                                0
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

        {/* ==================================================
            MENU STATUS
        ================================================== */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">

          <div className="p-6 border-b border-gray-200">

            <h2 className="text-lg font-semibold text-gray-800">
              Menu Status
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Current menu availability for{" "}
              {
                selectedBranch.branch_name
              }.
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
                      totalMenuItems >
                      0
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
                      totalMenuItems >
                      0
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
                      totalInventoryItems >
                      0
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

        {/* ==================================================
            RECENT MENU ITEMS
        ================================================== */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <h2 className="text-lg font-semibold text-gray-800">
                Recent Menu Items
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Recently added menu items for{" "}
                {
                  selectedBranch.branch_name
                }.
              </p>

            </div>

            <button
              onClick={() =>
                navigate("/menu")
              }
              className="text-sm font-semibold text-pink-500 hover:text-pink-600"
            >
              Manage Menu →
            </button>

          </div>

          <div className="max-h-96 overflow-y-auto overflow-x-auto">

            {recentMenuItems.length ===
            0 ? (

              <div className="text-center py-12">

                <p className="text-gray-400">
                  No menu items available.
                </p>

              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-gray-50 sticky top-0 z-10">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Item
                    </th>

                    {selectedBranch.isAll && (
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Branch
                      </th>
                    )}

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

                  {recentMenuItems.map(
                    (item) => (

                      <tr
                        key={`${item.branch_id}-${item.id}`}
                        className="border-t hover:bg-gray-50"
                      >

                        <td className="px-6 py-4">

                          <p className="font-medium text-gray-800">
                            {item.item_name}
                          </p>

                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                              {
                                item.description
                              }
                            </p>
                          )}

                        </td>

                        {selectedBranch.isAll && (
                          <td className="px-6 py-4">

                            <span className="px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">

                              {
                                item.branch_name
                              }

                            </span>

                          </td>
                        )}

                        <td className="px-6 py-4 text-gray-600">
                          {item.category ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-800">

                          {formatCurrency(
                            item.price
                          )}

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              String(
                                item.status
                              ).toLowerCase() ===
                              "available"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.status}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">

                          {formatDate(
                            item.created_at
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-6 text-sm text-gray-400 text-center">
          Taste It Café Management System •
          Owner Dashboard
        </div>

      </main>

    </div>
  );
}

export default OwnerDashboard;
