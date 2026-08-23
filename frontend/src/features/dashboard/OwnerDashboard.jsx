import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CircleX,
  ClipboardList,
  CreditCard,
  Package,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, FormField, Input, Modal, Select, Toast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import MenuItemModal from "../menu/components/MenuItemModal";
import { getMockDashboardData } from "../../services/mock/mockDashboardService";
import { getInventory } from "../../services/mock/mockInventoryService";
import { getMockMenuData, saveMenuItem } from "../../services/mock/mockMenuService";
import SalesTrendChart from "./components/SalesTrendChart";

const formatCurrency = (value) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const getInitialRecipeRow = () => ({ ingredientId: "", quantity: "", unit: "" });

function OwnerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const [dashboard, setDashboard] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [recipeMenuId, setRecipeMenuId] = useState("");
  const [recipeRows, setRecipeRows] = useState([getInitialRecipeRow()]);

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const loadDashboardData = async () => {
    if (!currentBranch?.id) return;
    const [dashboardData, menuDataResult, inventoryData] = await Promise.all([
      getMockDashboardData(currentBranch.id),
      getMockMenuData(currentBranch.id),
      getInventory(currentBranch.id),
    ]);

    setDashboard(dashboardData);
    setMenuData(menuDataResult);
    setInventoryItems(inventoryData);
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

    load();
    return () => { isCurrent = false; };
  }, [currentBranch?.id]);

  const refreshData = async () => {
    if (!currentBranch?.id) return;
    const [dashboardData, menuDataResult, inventoryData] = await Promise.all([
      getMockDashboardData(currentBranch.id),
      getMockMenuData(currentBranch.id),
      getInventory(currentBranch.id),
    ]);
    setDashboard(dashboardData);
    setMenuData(menuDataResult);
    setInventoryItems(inventoryData);
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
  const activeAlerts = inventoryItems.filter((item) => item.active && item.status !== "normal");

  return (
    <div className="min-h-screen bg-[#f5f4f0] p-4 sm:p-6 xl:p-7">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h1 className="text-[clamp(2rem,3vw,3rem)] font-black leading-none tracking-[-0.06em] text-slate-900">
            Welcome Back, Owner!
          </h1>

          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <CalendarDays size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">May 20, 2025</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Store size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{currentBranch?.name || "Babag Branch"}</span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Total Sales Today</p>
                <p className="mt-2 text-[clamp(1.8rem,2vw,2.4rem)] font-bold tracking-tight text-slate-900">{formatCurrency(summary.todaysSales)}</p>
                <p className="mt-2 text-xs font-medium text-emerald-600">+12.5% vs yesterday</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f6dfe8] text-[#d54085]">
                <ShoppingCart size={20} />
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Total Items Sold</p>
                <p className="mt-2 text-[clamp(1.8rem,2vw,2.4rem)] font-bold tracking-tight text-slate-900">{summary.todaysTransactions}</p>
                <p className="mt-2 text-xs font-medium text-emerald-600">+8.7% vs yesterday</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d9f3ef] text-[#179a8d]">
                <PackageCheck size={20} />
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Low Stock</p>
                <p className="mt-2 text-[clamp(1.8rem,2vw,2.4rem)] font-bold tracking-tight text-slate-900">{summary.lowStockItems}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">In 8 categories</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d9f3ef] text-[#179a8d]">
                <Package size={20} />
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Out of Stock</p>
                <p className="mt-2 text-[clamp(1.8rem,2vw,2.4rem)] font-bold tracking-tight text-slate-900">{summary.outOfStockItems}</p>
                <p className="mt-2 text-xs font-medium text-rose-500">Needs attention</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f8d7d7] text-[#d91f45]">
                <CircleX size={20} />
              </span>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <Card className="p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sales Overview</h2>
              <button type="button" className="rounded-xl border border-slate-200 bg-[#f7f4f2] px-3 py-2 text-sm font-medium text-slate-700">
                This Week
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
              <SalesTrendChart sales={dashboard.sales} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-[#f7f7f7] p-4">
                <p className="text-sm text-slate-500">Weekly Sales</p>
                <p className="mt-2 text-xl font-bold text-slate-900">₱30,850.00</p>
                <p className="mt-1 text-xs font-medium text-emerald-600">+15.3% vs last week</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#f7f7f7] p-4">
                <p className="text-sm text-slate-500">Best Day</p>
                <p className="mt-2 text-xl font-bold text-slate-900">Saturday</p>
                <p className="mt-1 text-xs font-medium text-slate-600">₱12,450.00</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#f7f7f7] p-4">
                <p className="text-sm text-slate-500">Average Daily Sales</p>
                <p className="mt-2 text-xl font-bold text-slate-900">₱21,121.43</p>
                <p className="mt-1 text-xs font-medium text-slate-600">Across 7 days</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recent Alerts</h2>
              <button type="button" className="text-sm font-semibold text-[#d54085] hover:text-[#be3268]">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {inventoryAlerts.map((item) => {
                const isOut = item.status === "out-of-stock";
                const statusText = isOut ? "Out of stock" : "Low stock";

                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f9f7f6] p-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isOut ? "bg-[#f8d7d7] text-[#d91f45]" : "bg-[#f9e7d2] text-[#d17b2d]"}`}>
                      <TriangleAlert size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{statusText}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{item.time || "Today"}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Card className="p-4 sm:p-5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickActions.map(({ label, icon: Icon, action, accent }) => (
                <button key={label} type="button" onClick={action} className="group rounded-2xl border border-slate-200 bg-[#faf7f4] p-3 text-center transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}>
                    <Icon size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recent Transactions</h2>
              <button type="button" className="text-sm font-semibold text-[#d54085] hover:text-[#be3268]">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-[minmax(0,1.2fr)_auto_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-[#f9f7f6] p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{transaction.id}</p>
                    <p className="text-xs text-slate-500">{transaction.time}</p>
                  </div>
                  <div className="text-right text-slate-500">{transaction.items}</div>
                  <div className="text-right font-bold text-slate-900">{formatCurrency(transaction.total)}</div>
                </div>
              ))}
            </div>
          </Card>
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