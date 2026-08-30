import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  CreditCard,
  Package,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, ContextualPopover, FormField, Input, Modal, Select, Toast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import MenuItemModal from "../menu/components/MenuItemModal";
import { getDashboardData } from "../../services/dashboardService";
import { getInventory } from "../../services/inventoryService";
import { getMockMenuData, saveMenuItem } from "../../services/menuService";
import { getPosTransactions } from "../../services/salesService";
import { useOverlay } from "../../context/useOverlay";
import SalesTrendChart from "./components/SalesTrendChart";

const formatCurrency = (value) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const periodLabels = { today: "Today", yesterday: "Yesterday", thisWeek: "This Week", lastWeek: "Last Week", thisMonth: "This Month", lastMonth: "Last Month", thisYear: "This Year" };
const periodOptions = Object.entries(periodLabels);
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hourLabels = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM"];
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = (date) => { const result = startOfDay(date); result.setDate(result.getDate() - ((result.getDay() + 6) % 7)); return result; };
const addDays = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

function transactionAmount(transaction) { return transaction.status === "COMPLETED" ? Number(transaction.total) || 0 : 0; }

function getRange(period, referenceDate) {
  const today = startOfDay(referenceDate);
  if (period === "today") return [today, addDays(today, 1)];
  if (period === "yesterday") return [addDays(today, -1), today];
  if (period === "thisWeek") { const start = startOfWeek(today); return [start, addDays(start, 7)]; }
  if (period === "lastWeek") { const start = addDays(startOfWeek(today), -7); return [start, addDays(start, 7)]; }
  if (period === "thisMonth") { const start = startOfMonth(today); return [start, new Date(today.getFullYear(), today.getMonth() + 1, 1)]; }
  if (period === "lastMonth") { const end = startOfMonth(today); const start = new Date(today.getFullYear(), today.getMonth() - 1, 1); return [start, end]; }
  return [startOfYear(today), new Date(today.getFullYear() + 1, 0, 1)];
}

function getSalesView(transactions, dashboardSales, period, referenceDate = new Date(), useFallback = true) {
  const sourceSales = dashboardSales ?? { weekly: [], monthly: [] };
  const [rangeStart, rangeEnd] = getRange(period, referenceDate);
  const validTransactions = transactions.filter((transaction) => transactionAmount(transaction) > 0);
  const inRange = validTransactions.filter((transaction) => { const createdAt = new Date(transaction.createdAt); return createdAt >= rangeStart && createdAt < rangeEnd; });
  let points;
  let unit;
  if (period === "today" || period === "yesterday") {
    points = hourLabels.map((label, index) => ({ label, value: inRange.filter((transaction) => { const hour = new Date(transaction.createdAt).getHours(); const bucketStart = 8 + index * 2; return index === 0 ? hour < bucketStart + 2 : index === hourLabels.length - 1 ? hour >= bucketStart : hour >= bucketStart && hour < bucketStart + 2; }).reduce((total, transaction) => total + transactionAmount(transaction), 0) }));
    unit = "hour";
  } else if (period === "thisWeek" || period === "lastWeek") {
    points = dayLabels.map((label, index) => ({ label, value: inRange.filter((transaction) => new Date(transaction.createdAt).getDay() === (index + 1) % 7).reduce((total, transaction) => total + transactionAmount(transaction), 0) }));
    unit = "day";
    if (useFallback && !inRange.length && period === "thisWeek") points = sourceSales.weekly.map((point) => ({ ...point }));
  } else if (period === "thisMonth" || period === "lastMonth") {
    const days = Math.round((rangeEnd - rangeStart) / 86400000);
    points = Array.from({ length: days }, (_, index) => { const day = index + 1; return { label: String(day), value: inRange.filter((transaction) => new Date(transaction.createdAt).getDate() === day).reduce((total, transaction) => total + transactionAmount(transaction), 0) }; });
    unit = "day";
  } else {
    points = Array.from({ length: 12 }, (_, index) => ({ label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(referenceDate.getFullYear(), index, 1)), value: inRange.filter((transaction) => new Date(transaction.createdAt).getMonth() === index).reduce((total, transaction) => total + transactionAmount(transaction), 0) }));
    unit = "month";
    if (useFallback && !inRange.length) points = points.map((point, index) => ({ ...point, value: sourceSales.monthly[index]?.value ?? 0 }));
  }
  if (!points.length) points = [{ label: "No data", value: 0 }];
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const best = points.reduce((current, point) => point.value > current.value ? point : current, { label: "No sales", value: 0 });
  const average = points.length ? total / points.length : 0;
  return { points, total, best, average, unit };
}

function getComparison(transactions, dashboardSales, period, referenceDate) {
  if (!Object.prototype.hasOwnProperty.call(periodLabels, period)) return null;
  const previousPeriod = period;
  const current = getSalesView(transactions, dashboardSales, period, referenceDate).total;
  const previousReferenceDate = new Date(referenceDate);
  if (period === "today" || period === "yesterday") previousReferenceDate.setDate(previousReferenceDate.getDate() - 1);
  if (period === "thisWeek" || period === "lastWeek") previousReferenceDate.setDate(previousReferenceDate.getDate() - 7);
  if (period === "thisMonth" || period === "lastMonth") previousReferenceDate.setMonth(previousReferenceDate.getMonth() - 1);
  if (period === "thisYear") previousReferenceDate.setFullYear(previousReferenceDate.getFullYear() - 1);
  const previous = getSalesView(transactions, dashboardSales, previousPeriod, previousReferenceDate, false).total;
  if (previous === 0) return current === 0 ? "0.0% vs previous period" : "New sales vs previous period";
  return `${((current - previous) / previous * 100).toFixed(1)}% vs previous period`;
}

const getInitialRecipeRow = () => ({ ingredientId: "", quantity: "", unit: "" });

function OwnerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const [dashboard, setDashboard] = useState(null);
  const [salesTransactions, setSalesTransactions] = useState([]);
  const [menuData, setMenuData] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState("thisWeek");
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [recipeMenuId, setRecipeMenuId] = useState("");
  const [recipeRows, setRecipeRows] = useState([getInitialRecipeRow()]);
  const { activeOverlay, setActiveOverlay } = useOverlay();
  const salesPeriodTriggerRef = useRef(null);
  const salesView = useMemo(() => getSalesView(salesTransactions, dashboard?.sales, salesPeriod), [salesTransactions, dashboard?.sales, salesPeriod]);
  const comparison = useMemo(() => getComparison(salesTransactions, dashboard?.sales, salesPeriod, new Date()), [salesTransactions, dashboard?.sales, salesPeriod]);

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const loadDashboardData = async () => {
    if (!currentBranch?.id) return;
    const [dashboardData, menuDataResult, inventoryData, transactionData] = await Promise.all([
      getDashboardData(currentBranch.id),
      getMockMenuData(currentBranch.id),
      getInventory(currentBranch.id),
      getPosTransactions(currentBranch.id, currentUser),
    ]);

    setDashboard(dashboardData);
    setMenuData(menuDataResult);
    setInventoryItems(inventoryData);
    setSalesTransactions(transactionData);
    setError("");
  };

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      try {
        setIsLoading(true);
        await loadDashboardData();
      } catch (loadError) {
        if (isCurrent) setError(loadError.message || "Dashboard data is unavailable.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void load();
    return () => { isCurrent = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranch?.id]);

  const refreshData = async () => {
    if (!currentBranch?.id) return;
    const [dashboardData, menuDataResult, inventoryData, transactionData] = await Promise.all([
      getDashboardData(currentBranch.id),
      getMockMenuData(currentBranch.id),
      getInventory(currentBranch.id),
      getPosTransactions(currentBranch.id, currentUser),
    ]);
    setDashboard(dashboardData);
    setMenuData(menuDataResult);
    setInventoryItems(inventoryData);
    setSalesTransactions(transactionData);
  };

  const handleMenuSave = async (form) => {
    try {
      await saveMenuItem(currentBranch.id, { ...form, status: form.status || "ACTIVE" }, { actorRole: currentUser.role });
      await refreshData();
      setMenuModalOpen(false);
      notify("Menu item added successfully.");
    } catch (saveError) {
      notify(saveError.message || "Unable to add menu item.", "danger");
    }
  };

  const updateRecipeRow = (index, field, value) => {
    setRecipeRows((currentRows) => currentRows.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const nextRow = { ...row, [field]: value };
      if (field === "ingredientId") {
        const ingredient = inventoryItems.find((item) => item.id === value);
        return { ...nextRow, unit: ingredient?.unit ?? nextRow.unit };
      }
      return nextRow;
    }));
  };

  const addRecipeRow = () => setRecipeRows((currentRows) => [...currentRows, getInitialRecipeRow()]);
  const removeRecipeRow = (index) => setRecipeRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index));

  const handleRecipeSave = async (event) => {
    event.preventDefault();
    if (!recipeMenuId) {
      notify("Select a menu item to save the recipe.", "danger");
      return;
    }

    const selectedMenuItem = menuData?.items.find((item) => item.id === recipeMenuId);
    if (!selectedMenuItem) {
      notify("The selected menu item could not be found.", "danger");
      return;
    }

    const normalizedRows = recipeRows.filter((row) => row.ingredientId && row.quantity);
    if (!normalizedRows.length) {
      notify("Add at least one ingredient for this recipe.", "danger");
      return;
    }

    const invalidRow = normalizedRows.find((row) => Number(row.quantity) <= 0);
    if (invalidRow) {
      notify("Each ingredient quantity must be greater than zero.", "danger");
      return;
    }

    try {
      await saveMenuItem(
        currentBranch.id,
        {
          ...selectedMenuItem,
          recipe: normalizedRows.map((row) => ({
            ingredientId: row.ingredientId,
            quantity: Number(row.quantity),
            unit: row.unit || inventoryItems.find((item) => item.id === row.ingredientId)?.unit || "pc",
          })),
        },
        { actorRole: currentUser.role },
      );
      await refreshData();
      setRecipeModalOpen(false);
      setRecipeMenuId("");
      setRecipeRows([getInitialRecipeRow()]);
      notify("Recipe added successfully.");
    } catch (saveError) {
      notify(saveError.message || "Unable to add recipe.", "danger");
    }
  };

  const quickActions = [
    { label: "Add menu item", icon: ShoppingCart, action: () => setMenuModalOpen(true), accent: "bg-[#f6dfe8] text-[#d54085]" },
    { label: "Add recipe", icon: ClipboardList, action: () => setRecipeModalOpen(true), accent: "bg-[#f9e7d2] text-[#d17b2d]" },
    { label: "View inventory", icon: PackageCheck, action: () => navigate("/app/inventory"), accent: "bg-[#d9f3ef] text-[#179a8d]" },
    { label: "Inventory alerts", icon: AlertTriangle, action: () => setAlertsModalOpen(true), accent: "bg-[#f8d7d7] text-[#d91f45]" },
    { label: "Sales transactions", icon: CreditCard, action: () => navigate("/app/sales"), accent: "bg-[#f6dfe8] text-[#d54085]" },
    { label: "Reconciliation", icon: BarChart3, action: () => navigate("/app/reconciliation"), accent: "bg-[#d9f3ef] text-[#179a8d]" },
    { label: "Sales reports", icon: Sparkles, action: () => navigate("/app/reports"), accent: "bg-[#d9f3ef] text-[#179a8d]" },
    { label: "AI weekly summary", icon: BriefcaseBusiness, action: () => setAiSummaryOpen(true), accent: "bg-[#f8d7d7] text-[#d91f45]" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse rounded-2xl border border-taste-border bg-white p-6 shadow-card">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard || !menuData) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] p-4 sm:p-6 xl:p-8">
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-rose-700 shadow-card">
          <p className="text-lg font-semibold">Dashboard unavailable</p>
          <p className="mt-2 text-sm">{error || "Unable to load dashboard data."}</p>
        </div>
      </div>
    );
  }

  const { summary, recentTransactions, inventoryAlerts } = dashboard;
  const { points: salesPoints, total: salesTotal, best: bestSalesDay, average: averageSales, unit: salesUnit } = salesView;
  const totalLabel = salesPeriod === "today" || salesPeriod === "yesterday" ? "Total Sales" : salesPeriod === "thisYear" ? "Yearly Sales" : salesPeriod === "thisMonth" || salesPeriod === "lastMonth" ? "Monthly Sales" : "Weekly Sales";
  const activeAlerts = inventoryItems.filter((item) => item.active && item.status !== "normal");

  return (
    <div className="min-h-screen bg-[#f5f4f0] p-4 sm:p-6 xl:p-7">
      <div className="space-y-6">
        <div className="dashboard-stat-grid grid min-w-0 gap-4">
          <Card className="h-full min-w-0 p-4 sm:p-5">
            <div className="flex h-full items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium leading-5 text-slate-500 sm:text-sm">Total Sales Today</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">{formatCurrency(summary.todaysSales)}</p>
                <p className="mt-1 text-[11px] font-medium text-emerald-600 sm:text-xs">+12.5% vs yesterday</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6dfe8] text-[#d54085]">
                <ShoppingCart size={18} />
              </span>
            </div>
          </Card>

          <Card className="h-full min-w-0 p-4 sm:p-5">
            <div className="flex h-full items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium leading-5 text-slate-500 sm:text-sm">Total Items Sold</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">{summary.todaysTransactions}</p>
                <p className="mt-1 text-[11px] font-medium text-emerald-600 sm:text-xs">+8.7% vs yesterday</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f3ef] text-[#179a8d]">
                <PackageCheck size={18} />
              </span>
            </div>
          </Card>

          <Card className="h-full min-w-0 p-4 sm:p-5">
            <div className="flex h-full items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium leading-5 text-slate-500 sm:text-sm">Inventory Items</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">{summary.lowStockItems + summary.outOfStockItems + 12}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">Current branch stock</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f3ef] text-[#179a8d]">
                <Package size={18} />
              </span>
            </div>
          </Card>

          <Card className="h-full min-w-0 p-4 sm:p-5">
            <div className="flex h-full items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium leading-5 text-slate-500 sm:text-sm">Low Stock</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">{summary.lowStockItems}</p>
                <p className="mt-1 text-[11px] font-medium text-amber-600 sm:text-xs">Needs review</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f9e7d2] text-[#d17b2d]">
                <TriangleAlert size={18} />
              </span>
            </div>
          </Card>
        </div>

        <div className="dashboard-main-grid grid min-w-0 gap-6">
          <div className="dashboard-column grid min-w-0 gap-6">
            <Card className="flex h-full flex-col p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Sales Overview</h2>
                <button ref={salesPeriodTriggerRef} type="button" onClick={() => setActiveOverlay((current) => current === "salesPeriod" ? null : "salesPeriod")} className="flex items-center gap-2 rounded-xl border border-taste-border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-taste-purple/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple sm:px-3 sm:py-2 sm:text-sm" aria-expanded={activeOverlay === "salesPeriod"} aria-label={`Sales period: ${periodLabels[salesPeriod]}`}>
                  <span>{periodLabels[salesPeriod]}</span><span className="text-xs text-taste-muted" aria-hidden="true">▼</span>
                </button>
              </div>

              <ContextualPopover open={activeOverlay === "salesPeriod"} anchorRef={salesPeriodTriggerRef} onClose={() => setActiveOverlay(null)} width={180}>
                <div className="space-y-1">{periodOptions.map(([value, label]) => <button key={value} type="button" onClick={() => { setSalesPeriod(value); setActiveOverlay(null); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-taste-purple-soft ${salesPeriod === value ? "bg-taste-purple-soft font-semibold text-taste-text" : "text-slate-700"}`}><span>{label}</span>{salesPeriod === value && <span aria-hidden="true">✓</span>}</button>)}</div>
              </ContextualPopover>

              <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
                <SalesTrendChart sales={{ [salesPeriod]: salesPoints }} period={salesPeriod} periodLabel={periodLabels[salesPeriod]} />
              </div>

              <div className="dashboard-sales-stats-grid mt-4 grid gap-3 sm:mt-5 sm:gap-4">
                <div className="rounded-2xl border border-slate-200 bg-[#f7f7f7] p-3 sm:p-4">
                  <p className="text-xs text-slate-500 sm:text-sm">{totalLabel}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 sm:mt-2 sm:text-xl">{formatCurrency(salesTotal)}</p>
                  <p className="mt-1 text-[11px] font-medium text-emerald-600 sm:text-xs">{comparison ?? "Selected period total"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#f7f7f7] p-3 sm:p-4">
                  <p className="text-xs text-slate-500 sm:text-sm">Best {salesUnit === "hour" ? "Hour" : salesUnit === "month" ? "Month" : "Day"}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 sm:mt-2 sm:text-xl">{bestSalesDay?.label ?? "-"}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-600 sm:text-xs">{bestSalesDay ? formatCurrency(bestSalesDay.value) : "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#f7f7f7] p-3 sm:p-4">
                  <p className="text-xs text-slate-500 sm:text-sm">Average {salesUnit === "hour" ? "Hourly" : salesUnit === "month" ? "Monthly" : "Daily"} Sales</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 sm:mt-2 sm:text-xl">{formatCurrency(averageSales)}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-600 sm:text-xs">Average per data point</p>
                </div>
              </div>
            </Card>

            <Card className="flex h-full flex-col p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Quick Actions</h2>
              </div>

              <div className="dashboard-quick-actions-grid mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {quickActions.map(({ label, icon: Icon, action, accent }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="group min-w-0 rounded-2xl border border-slate-200 bg-[#faf7f4] p-2.5 text-center transition duration-200 hover:-translate-y-0.5 hover:border-[#d17fb2]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17fb2]/40 sm:p-3"
                  >
                    <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${accent} sm:h-14 sm:w-14`}>
                      <Icon size={20} className="sm:h-6 sm:w-6" />
                    </div>
                    <p className="mt-2 break-words text-xs font-medium leading-4 text-slate-700 sm:mt-3 sm:text-sm">{label}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="dashboard-column grid min-w-0 gap-6">
            <Card className="flex h-full flex-col p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Recent Alerts</h2>
                <button type="button" onClick={() => navigate("/app/inventory?status=alerts")} className="text-sm font-semibold text-[#d54085] hover:text-[#be3268] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17fb2]/40">
                  View All
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                {inventoryAlerts.map((item) => {
                  const isOut = item.status === "out-of-stock";
                  const statusText = isOut ? "Out of stock" : "Low stock";

                  return (
                    <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-[#f9f7f6] p-2.5 sm:gap-3 sm:p-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isOut ? "bg-[#f8d7d7] text-[#d91f45]" : "bg-[#f9e7d2] text-[#d17b2d]"}`}>
                        <TriangleAlert size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{item.name}</p>
                        <p className="text-xs text-slate-500 sm:text-sm">{statusText}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-400">{item.time || "Today"}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="flex h-full flex-col p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Recent Transactions</h2>
                <button type="button" onClick={() => navigate("/app/sales")} className="text-sm font-semibold text-[#d54085] hover:text-[#be3268] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d17fb2]/40">
                  View All
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-slate-200 bg-[#f9f7f6] p-2.5 text-xs sm:flex-nowrap sm:p-3 sm:text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{transaction.id}</p>
                      <p className="text-xs text-slate-500">{transaction.time}</p>
                    </div>
                    <div className="ml-auto shrink-0 text-right text-slate-500">{transaction.items}</div>
                    <div className="shrink-0 text-right font-bold text-slate-900">{formatCurrency(transaction.total)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {menuData && (
        <MenuItemModal
          item={null}
          categories={menuData.categories}
          ingredients={inventoryItems}
          open={menuModalOpen}
          onClose={() => setMenuModalOpen(false)}
          onSave={handleMenuSave}
        />
      )}

      <Modal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} title="Add recipe" className="max-w-xl overflow-y-auto" footer={<><Button variant="outline" onClick={() => setRecipeModalOpen(false)}>Cancel</Button><Button type="submit" form="recipe-form">Save recipe</Button></>}>
        <form id="recipe-form" className="space-y-4" onSubmit={handleRecipeSave} noValidate>
          <FormField label="Menu item" required>
            <Select value={recipeMenuId} onChange={(event) => setRecipeMenuId(event.target.value)}>
              <option value="">Select a menu item</option>
              {(menuData?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </FormField>

          <div className="space-y-3">
            {recipeRows.map((row, index) => (
              <div key={`${row.ingredientId || "new"}-${index}`} className="grid gap-3 rounded-xl border border-taste-border bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto] sm:items-end">
                <FormField label="Ingredient">
                  <Select value={row.ingredientId} onChange={(event) => updateRecipeRow(index, "ingredientId", event.target.value)}>
                    <option value="">Select ingredient</option>
                    {inventoryItems.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Qty">
                  <Input type="number" min="0" step="0.01" value={row.quantity} onChange={(event) => updateRecipeRow(index, "quantity", event.target.value)} placeholder="0" />
                </FormField>

                <FormField label="Unit">
                  <Input value={row.unit || ""} readOnly aria-label={`Unit for recipe row ${index + 1}`} />
                </FormField>

                <Button type="button" variant="ghost" size="sm" className="text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => removeRecipeRow(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addRecipeRow} className="w-full">Add ingredient</Button>
        </form>
      </Modal>

      <Modal open={alertsModalOpen} onClose={() => setAlertsModalOpen(false)} title="Inventory alerts" className="max-w-xl" footer={<Button variant="outline" onClick={() => setAlertsModalOpen(false)}>Close</Button>}>
        <div className="space-y-3">
          {activeAlerts.length ? (
            activeAlerts.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.category} · {item.currentQuantity} {item.unit}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "out-of-stock" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.status === "out-of-stock" ? "Out of stock" : "Low stock"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">No active alerts for this branch right now.</p>
          )}
        </div>
      </Modal>

      <Modal open={aiSummaryOpen} onClose={() => setAiSummaryOpen(false)} title="AI weekly summary" className="max-w-xl" footer={<Button variant="outline" onClick={() => setAiSummaryOpen(false)}>Close</Button>}>
        <div className="space-y-4">
          <div className="rounded-xl bg-[#f7f4f2] p-4">
            <p className="text-sm text-slate-500">Branch</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{currentBranch?.name || "Selected branch"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm text-slate-500">Weekly sales</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(summary.todaysSales * 7)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm text-slate-500">Inventory alerts</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{activeAlerts.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-taste-border bg-[#f9f7f6] p-4">
            <p className="text-sm font-semibold text-slate-900">Highlights</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>• Primary focus: maintain stock for the current sales volume.</li>
              <li>• Low-stock items should be replenished before the next peak demand window.</li>
              <li>• Sales performance remains steady across the current period.</li>
            </ul>
          </div>
        </div>
      </Modal>

      <Toast open={toast.open} onClose={() => setToast((current) => ({ ...current, open: false }))} variant={toast.variant}>{toast.message}</Toast>
    </div>
  );
}

export default OwnerDashboard;